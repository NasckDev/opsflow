import { appendAuditEntry, createAuditEntry } from './audit';
import { Permission, can } from './permissions';
import {
  Actor,
  RequestStatus,
  Result,
  WORKFLOW_ACTIONS,
  WorkflowAction,
  WorkflowRequest,
  fail,
  ok,
} from './request.model';
import { evaluateSla } from './sla';

interface TransitionDefinition {
  readonly from: readonly RequestStatus[];
  readonly to: RequestStatus;
  readonly permission: Permission;
  readonly commentRequired: boolean;
}

/** Tabela de transições: cada ação tem origem, destino e permissão exigida. */
export const TRANSITIONS: Readonly<Record<WorkflowAction, TransitionDefinition>> = Object.freeze({
  submit: { from: ['draft'], to: 'in_review', permission: 'request.submit', commentRequired: false },
  return: {
    from: ['in_review'],
    to: 'returned',
    permission: 'request.return',
    commentRequired: true,
  },
  resubmit: {
    from: ['returned'],
    to: 'in_review',
    permission: 'request.submit',
    commentRequired: false,
  },
  approve: {
    from: ['in_review'],
    to: 'approved',
    permission: 'request.approve',
    commentRequired: false,
  },
  reject: {
    from: ['in_review'],
    to: 'rejected',
    permission: 'request.reject',
    commentRequired: true,
  },
  complete: {
    from: ['approved'],
    to: 'completed',
    permission: 'request.complete',
    commentRequired: false,
  },
});

export type TransitionError =
  | 'invalid_transition'
  | 'forbidden'
  | 'separation_of_duties'
  | 'comment_required'
  | 'justification_required';

export interface TransitionContext {
  readonly actor: Actor;
  readonly now: Date;
  readonly comment?: string;
}

/** Ações que não podem ser executadas por quem criou a solicitação. */
const SEGREGATED_ACTIONS: readonly WorkflowAction[] = ['return', 'approve', 'reject'];

function hasComment(comment: string | undefined): boolean {
  return (comment?.trim().length ?? 0) > 0;
}

function violatesSegregation(
  request: WorkflowRequest,
  action: WorkflowAction,
  actor: Actor,
): boolean {
  return SEGREGATED_ACTIONS.includes(action) && request.requester === actor.name;
}

/** Guardas de papel, estado e segregação — sem considerar comentário. */
function checkAccess(
  request: WorkflowRequest,
  action: WorkflowAction,
  actor: Actor,
): TransitionError | null {
  const definition = TRANSITIONS[action];
  if (!definition.from.includes(request.status)) return 'invalid_transition';
  if (!can(actor.role, definition.permission)) return 'forbidden';
  if (violatesSegregation(request, action, actor)) return 'separation_of_duties';
  return null;
}

/** Aprovar fora do SLA exige justificativa registrada na auditoria. */
export function requiresComment(
  request: WorkflowRequest,
  action: WorkflowAction,
  now: Date,
): boolean {
  if (TRANSITIONS[action].commentRequired) return true;
  return action === 'approve' && evaluateSla(request, now).state === 'breached';
}

export function checkTransition(
  request: WorkflowRequest,
  action: WorkflowAction,
  context: TransitionContext,
): TransitionError | null {
  const accessError = checkAccess(request, action, context.actor);
  if (accessError) return accessError;
  if (hasComment(context.comment)) return null;
  if (TRANSITIONS[action].commentRequired) return 'comment_required';
  if (requiresComment(request, action, context.now)) return 'justification_required';
  return null;
}

export function availableActions(request: WorkflowRequest, actor: Actor): WorkflowAction[] {
  return WORKFLOW_ACTIONS.filter((action) => checkAccess(request, action, actor) === null);
}

export function applyTransition(
  request: WorkflowRequest,
  action: WorkflowAction,
  context: TransitionContext,
): Result<WorkflowRequest, TransitionError> {
  const error = checkTransition(request, action, context);
  if (error) return fail(error);

  const to = TRANSITIONS[action].to;
  const entry = createAuditEntry(`${request.id}-${request.audit.length + 1}`, {
    actor: context.actor,
    action,
    from: request.status,
    to,
    at: context.now,
    comment: context.comment,
  });
  return ok({
    ...request,
    status: to,
    updatedAt: context.now.toISOString(),
    audit: appendAuditEntry(request.audit, entry),
  });
}
