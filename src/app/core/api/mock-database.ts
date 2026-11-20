import { adaptLegacyRequest } from '../../domain/legacy-adapter';
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
import {
  CommentError,
  RequestComment,
  sanitizeDocumentName,
  validateCommentBody,
} from '../../domain/comments';
import { SEED_COMMENTS, generateHistory } from './history-data';
import { SEEDS, creationEntry, seedRequest } from './seed-data';
import { LEGACY_EXPORT } from './legacy-seed';

export interface RequestFilter {
  readonly query?: string;
  readonly status?: RequestStatus | '';
}

export type MutationError = TransitionError | 'not_found' | 'conflict';

function matches(request: WorkflowRequest, filter: RequestFilter): boolean {
  const query = filter.query?.trim().toLowerCase() ?? '';
  const byStatus = !filter.status || request.status === filter.status;
  const byQuery =
    !query ||
    request.code.toLowerCase().includes(query) ||
    request.title.toLowerCase().includes(query);
  return byStatus && byQuery;
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
      const at = new Date(now.getTime() - seed.hoursAgo * 3_600_000);
      this.pushComment(seed.requestId, seed.author, seed.body, at);
    });
    LEGACY_EXPORT.map(adaptLegacyRequest).forEach((result) => {
      if (result.ok) this.store(result.value);
    });
  }

  list(filter: RequestFilter): WorkflowRequest[] {
    return [...this.records.values()]
      .filter((request) => matches(request, filter))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(id: string): WorkflowRequest | undefined {
    return this.records.get(id);
  }

  create(input: NewRequestInput, actor: Actor, now: Date): WorkflowRequest {
    this.sequence += 1;
    const id = `req-${this.sequence}`;
    const request: WorkflowRequest = {
      ...input,
      documents: [...input.documents],
      id,
      code: `OPS-${String(this.sequence).padStart(4, '0')}`,
      requester: actor.name,
      status: 'draft',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      audit: [creationEntry(id, actor, now)],
    };
    return this.store(request);
  }

  transition(
    id: string,
    command: { action: WorkflowAction; actor: Actor; comment?: string; expectedStatus: RequestStatus },
    now: Date,
  ): Result<WorkflowRequest, MutationError> {
    const current = this.records.get(id);
    if (!current) return fail('not_found');
    if (current.status !== command.expectedStatus) return fail('conflict');
    const result = applyTransition(current, command.action, { ...command, now });
    return result.ok ? ok(this.store(result.value)) : result;
  }

  listComments(requestId: string): RequestComment[] | undefined {
    if (!this.records.has(requestId)) return undefined;
    return [...(this.comments.get(requestId) ?? [])];
  }

  addComment(
    requestId: string,
    actor: Actor,
    body: string,
    now: Date,
  ): Result<RequestComment, CommentError | 'not_found'> {
    if (!this.records.has(requestId)) return fail('not_found');
    const error = validateCommentBody(body);
    if (error) return fail(error);
    return ok(this.pushComment(requestId, actor, body.trim(), now));
  }

  /** Anexo simulado: só registra o nome do arquivo na solicitação. */
  addDocument(requestId: string, name: string): Result<WorkflowRequest, 'not_found' | 'invalid_document'> {
    const current = this.records.get(requestId);
    if (!current) return fail('not_found');
    const clean = sanitizeDocumentName(name);
    if (!clean) return fail('invalid_document');
    if (current.documents.includes(clean)) return ok(current);
    return ok(this.store({ ...current, documents: [...current.documents, clean] }));
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
