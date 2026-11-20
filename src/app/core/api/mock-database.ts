import {
  CommentError,
  RequestComment,
  sanitizeDocumentName,
  validateCommentBody,
} from '../../domain/comments';
import { adaptLegacyRequest } from '../../domain/legacy-adapter';
import { can } from '../../domain/permissions';
import {
  Actor,
  NewRequestInput,
  RequestStatus,
  Result,
  WorkflowAction,
  WorkflowRequest,
  fail,
  ok,
} from '../../domain/request.model';
import { TransitionError, applyTransition } from '../../domain/workflow-machine';
import { SEED_COMMENTS, generateHistory } from './history-data';
import { LEGACY_EXPORT } from './legacy-seed';
import { SEEDS, creationEntry, seedRequest } from './seed-data';

const HOUR_MS = 3_600_000;

export interface RequestFilter {
  readonly query?: string;
  readonly status?: RequestStatus | '';
}

export type AccessError = 'not_found' | 'forbidden';
export type MutationError = TransitionError | AccessError | 'conflict';
export type DocumentError = AccessError | 'invalid_document' | 'invalid_state';
export type CommentFailure = CommentError | AccessError;

export interface TransitionCommand {
  readonly action: WorkflowAction;
  readonly expectedStatus: RequestStatus;
  readonly expectedUpdatedAt?: string;
  readonly comment?: string;
}

/** Estados em que ainda dá para anexar documentos. */
const ATTACHABLE: readonly RequestStatus[] = ['draft', 'returned'];

function matches(request: WorkflowRequest, filter: RequestFilter): boolean {
  const query = filter.query?.trim().toLowerCase() ?? '';
  const byStatus = !filter.status || request.status === filter.status;
  const byQuery =
    !query ||
    request.code.toLowerCase().includes(query) ||
    request.title.toLowerCase().includes(query);
  return byStatus && byQuery;
}

/** Solicitante só enxerga o que criou; os demais papéis veem tudo. */
function canSee(request: WorkflowRequest, actor: Actor): boolean {
  return actor.role !== 'requester' || request.requester === actor.name;
}

/** A trilha de auditoria só sai do servidor para quem tem `audit.view`. */
function redact(request: WorkflowRequest, actor: Actor): WorkflowRequest {
  return can(actor.role, 'audit.view') ? request : { ...request, audit: [] };
}

/** Banco em memória do mock: substitui um backend real no navegador. */
export class MockDatabase {
  private readonly records = new Map<string, WorkflowRequest>();
  private readonly comments = new Map<string, RequestComment[]>();
  private sequence = 0;

  constructor(now: Date = new Date()) {
    const specs = [...SEEDS, ...generateHistory()];
    specs.forEach((spec, index) => this.store(seedRequest(spec, index, now)));
    this.sequence = specs.length;
    SEED_COMMENTS.forEach((seed) => {
      const at = new Date(now.getTime() - seed.hoursAgo * HOUR_MS);
      this.pushComment(seed.requestId, seed.author, seed.body, at);
    });
    LEGACY_EXPORT.map(adaptLegacyRequest).forEach((result) => {
      if (result.ok) this.store(result.value);
    });
  }

  list(filter: RequestFilter, actor: Actor): WorkflowRequest[] {
    return [...this.records.values()]
      .filter((request) => canSee(request, actor) && matches(request, filter))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((request) => redact(request, actor));
  }

  get(id: string, actor: Actor): Result<WorkflowRequest, AccessError> {
    const found = this.records.get(id);
    if (!found) return fail('not_found');
    return canSee(found, actor) ? ok(redact(found, actor)) : fail('forbidden');
  }

  /**
   * Cria e, se pedido, já envia para revisão. O envio é validado ANTES de gravar:
   * se falhar, nada é criado (sem rascunho órfão).
   */
  create(
    input: NewRequestInput,
    actor: Actor,
    now: Date,
    submit: boolean,
  ): Result<WorkflowRequest, TransitionError | 'forbidden'> {
    if (!can(actor.role, 'request.create')) return fail('forbidden');
    const sequence = this.sequence + 1;
    const id = `req-${sequence}`;
    const draft: WorkflowRequest = {
      ...input,
      documents: [...input.documents],
      id,
      code: `OPS-${String(sequence).padStart(4, '0')}`,
      requester: actor.name,
      status: 'draft',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      audit: [creationEntry(id, actor, now)],
    };
    let created = draft;
    if (submit) {
      const submitted = applyTransition(draft, 'submit', { actor, now });
      if (!submitted.ok) return submitted;
      created = submitted.value;
    }
    this.sequence = sequence;
    return ok(redact(this.store(created), actor));
  }

  transition(
    id: string,
    command: TransitionCommand,
    actor: Actor,
    now: Date,
  ): Result<WorkflowRequest, MutationError> {
    const current = this.records.get(id);
    if (!current) return fail('not_found');
    if (!canSee(current, actor)) return fail('forbidden');
    const stale =
      current.status !== command.expectedStatus ||
      (command.expectedUpdatedAt !== undefined && current.updatedAt !== command.expectedUpdatedAt);
    if (stale) return fail('conflict');
    const result = applyTransition(current, command.action, {
      actor,
      now,
      comment: command.comment,
    });
    return result.ok ? ok(redact(this.store(result.value), actor)) : result;
  }

  listComments(requestId: string, actor: Actor): Result<RequestComment[], AccessError> {
    const request = this.records.get(requestId);
    if (!request) return fail('not_found');
    if (!canSee(request, actor)) return fail('forbidden');
    return ok([...(this.comments.get(requestId) ?? [])]);
  }

  addComment(
    requestId: string,
    actor: Actor,
    body: string,
    now: Date,
  ): Result<RequestComment, CommentFailure> {
    const request = this.records.get(requestId);
    if (!request) return fail('not_found');
    if (actor.role === 'auditor' || !canSee(request, actor)) return fail('forbidden');
    const error = validateCommentBody(body);
    if (error) return fail(error);
    return ok(this.pushComment(requestId, actor, body.trim(), now));
  }

  /** Anexo simulado: só registra o nome do arquivo, e só enquanto a solicitação é editável. */
  addDocument(
    requestId: string,
    actor: Actor,
    name: string,
  ): Result<WorkflowRequest, DocumentError> {
    const current = this.records.get(requestId);
    if (!current) return fail('not_found');
    const isOwner = current.requester === actor.name;
    if (actor.role === 'auditor' || (!isOwner && actor.role !== 'admin')) return fail('forbidden');
    if (!ATTACHABLE.includes(current.status)) return fail('invalid_state');
    const clean = sanitizeDocumentName(name);
    if (!clean) return fail('invalid_document');
    if (current.documents.includes(clean)) return ok(redact(current, actor));
    const updated = { ...current, documents: [...current.documents, clean] };
    return ok(redact(this.store(updated), actor));
  }

  private pushComment(requestId: string, actor: Actor, body: string, at: Date): RequestComment {
    const thread = this.comments.get(requestId) ?? [];
    const comment: RequestComment = {
      id: `${requestId}-c${thread.length + 1}`,
      requestId,
      author: actor.name,
      role: actor.role,
      at: at.toISOString(),
      body,
    };
    this.comments.set(requestId, [...thread, comment]);
    return comment;
  }

  private store(request: WorkflowRequest): WorkflowRequest {
    this.records.set(request.id, request);
    return request;
  }
}
