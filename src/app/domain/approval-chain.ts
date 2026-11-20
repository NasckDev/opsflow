import { AuditEntry, Role, WorkflowRequest } from './request.model';

export type ChainStepId = 'request' | 'review' | 'approval' | 'completion';
export type ChainStepState = 'done' | 'current' | 'pending' | 'rejected' | 'returned';

export interface ChainStep {
  readonly id: ChainStepId;
  readonly role: Role;
  readonly state: ChainStepState;
  /** Quem agiu nesta etapa (quando já houve ação). */
  readonly actor?: string;
  readonly at?: string;
}

function lastEntry(
  audit: readonly AuditEntry[],
  predicate: (entry: AuditEntry) => boolean,
): AuditEntry | undefined {
  return [...audit].reverse().find(predicate);
}

function requestStep(request: WorkflowRequest): ChainStep {
  const submitted = audit(request).find(
    (entry) => entry.action === 'submit' || entry.action === 'migrate',
  );
  return {
    id: 'request',
    role: 'requester',
    state: request.status === 'draft' ? 'current' : 'done',
    actor: request.requester,
    at: submitted?.at,
  };
}

const audit = (request: WorkflowRequest) => request.audit;

function reviewStep(request: WorkflowRequest): ChainStep {
  const returned = lastEntry(audit(request), (entry) => entry.action === 'return');
  const rejectedByReviewer = lastEntry(
    audit(request),
    (entry) => entry.action === 'reject' && entry.role === 'reviewer',
  );
  const actedBy = rejectedByReviewer ?? returned;
  const byStatus: Partial<Record<WorkflowRequest['status'], ChainStep['state']>> = {
    draft: 'pending',
    in_review: 'current',
    returned: 'returned',
    approved: 'done',
    completed: 'done',
    rejected: rejectedByReviewer ? 'rejected' : 'done',
  };
  return {
    id: 'review',
    role: 'reviewer',
    state: byStatus[request.status] ?? 'pending',
    actor: actedBy?.actor,
    at: actedBy?.at,
  };
}

function approvalStep(request: WorkflowRequest): ChainStep {
  const decision = lastEntry(
    audit(request),
    (entry) =>
      entry.action === 'approve' || (entry.action === 'reject' && entry.role !== 'reviewer'),
  );
  const rejectedByApprover = request.status === 'rejected' && decision?.action === 'reject';
  const byStatus: Partial<Record<WorkflowRequest['status'], ChainStep['state']>> = {
    in_review: 'current',
    approved: 'done',
    completed: 'done',
    rejected: rejectedByApprover ? 'rejected' : 'pending',
  };
  const isFinal =
    request.status === 'approved' || request.status === 'completed' || rejectedByApprover;
  return {
    id: 'approval',
    role: 'approver',
    state: byStatus[request.status] ?? 'pending',
    actor: isFinal ? decision?.actor : undefined,
    at: isFinal ? decision?.at : undefined,
  };
}

function completionStep(request: WorkflowRequest): ChainStep {
  const completed = lastEntry(audit(request), (entry) => entry.action === 'complete');
  return {
    id: 'completion',
    role: 'approver',
    state:
      request.status === 'completed'
        ? 'done'
        : request.status === 'approved'
          ? 'current'
          : 'pending',
    actor: completed?.actor,
    at: completed?.at,
  };
}

/** Cadeia de aprovação derivada da trilha de auditoria; não altera o domínio. */
export function buildApprovalChain(request: WorkflowRequest): readonly ChainStep[] {
  return [
    requestStep(request),
    reviewStep(request),
    approvalStep(request),
    completionStep(request),
  ];
}
