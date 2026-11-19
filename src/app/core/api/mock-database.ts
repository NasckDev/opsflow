import { createAuditEntry } from '../../domain/audit';
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
import { LEGACY_EXPORT } from './legacy-seed';

const HOUR = 3_600_000;

export interface RequestFilter {
  readonly query?: string;
  readonly status?: RequestStatus | '';
}

export type MutationError = TransitionError | 'not_found' | 'conflict';

interface SeedSpec {
  readonly title: string;
  readonly category: WorkflowRequest['category'];
  readonly priority: WorkflowRequest['priority'];
  readonly amount: number;
  readonly requester: string;
  readonly dueInHours: number;
  readonly path: readonly { action: WorkflowAction; actor: Actor; comment?: string }[];
}

const ANA: Actor = { name: 'Ana Souza', role: 'requester' };
const BRUNO: Actor = { name: 'Bruno Lima', role: 'reviewer' };
const CARLA: Actor = { name: 'Carla Mendes', role: 'approver' };

const SEEDS: readonly SeedSpec[] = [
  { title: 'Licenças de IDE para o squad Pagamentos', category: 'purchase', priority: 'medium', amount: 8400, requester: 'Ana Souza', dueInHours: 120, path: [] },
  { title: 'Acesso ao data warehouse para BI', category: 'access', priority: 'high', amount: 0.01, requester: 'Ana Souza', dueInHours: 10, path: [{ action: 'submit', actor: ANA }] },
  { title: 'Viagem para workshop com cliente em Curitiba', category: 'travel', priority: 'low', amount: 2780.5, requester: 'Ana Souza', dueInHours: -6, path: [{ action: 'submit', actor: ANA }] },
  { title: 'Monitores para home office', category: 'purchase', priority: 'medium', amount: 5600, requester: 'Ana Souza', dueInHours: 72, path: [{ action: 'submit', actor: ANA }, { action: 'return', actor: BRUNO, comment: 'Anexe três cotações.' }] },
  { title: 'Contrato de suporte do ERP', category: 'contract', priority: 'high', amount: 96000, requester: 'Ana Souza', dueInHours: 48, path: [{ action: 'submit', actor: ANA }, { action: 'approve', actor: CARLA }] },
];

function seedRequest(spec: SeedSpec, index: number, now: Date): WorkflowRequest {
  const id = `req-${index + 1}`;
  const createdAt = new Date(now.getTime() - 48 * HOUR);
  const draft: WorkflowRequest = {
    id,
    code: `OPS-${String(index + 1).padStart(4, '0')}`,
    title: spec.title,
    description: 'Solicitação fictícia gerada para demonstração.',
    category: spec.category,
    priority: spec.priority,
    amount: spec.amount,
    requester: spec.requester,
    status: 'draft',
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    dueAt: new Date(now.getTime() + spec.dueInHours * HOUR).toISOString(),
    documents: index % 2 === 0 ? ['orcamento.pdf'] : [],
    audit: [creationEntry(id, ANA, createdAt)],
  };
  return spec.path.reduce((request, step) => {
    const result = applyTransition(request, step.action, { ...step, now: createdAt });
    return result.ok ? result.value : request;
  }, draft);
}

function creationEntry(id: string, actor: Actor, at: Date) {
  return createAuditEntry(`${id}-1`, { actor, action: 'create', from: null, to: 'draft', at });
}

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
  private sequence = 0;

  constructor(now: Date = new Date()) {
    SEEDS.forEach((spec, index) => this.store(seedRequest(spec, index, now)));
    this.sequence = SEEDS.length;
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

  private store(request: WorkflowRequest): WorkflowRequest {
    this.records.set(request.id, request);
    return request;
  }
}
