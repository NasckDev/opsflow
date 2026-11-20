import { Actor, WorkflowRequest } from './request.model';
import { evaluateSla } from './sla';
import { availableActions } from './workflow-machine';

export type NotificationKind =
  'sla_breached' | 'sla_at_risk' | 'task' | 'returned' | 'approved' | 'rejected';

export interface AppNotification {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly requestId: string;
  readonly code: string;
  readonly title: string;
  readonly at: string;
}

const SEVERITY: Readonly<Record<NotificationKind, number>> = {
  sla_breached: 0,
  sla_at_risk: 1,
  returned: 2,
  task: 3,
  rejected: 4,
  approved: 5,
};

const MAX_NOTIFICATIONS = 20;

function taskKind(request: WorkflowRequest, now: Date): NotificationKind {
  const state = evaluateSla(request, now).state;
  if (state === 'breached') return 'sla_breached';
  if (state === 'at_risk') return 'sla_at_risk';
  return 'task';
}

function ownOutcome(request: WorkflowRequest): NotificationKind | null {
  if (request.status === 'returned') return 'returned';
  if (request.status === 'approved') return 'approved';
  if (request.status === 'rejected') return 'rejected';
  return null;
}

/** Avisos derivados do estado atual: o que precisa de ação e o que mudou nas minhas solicitações. */
export function buildNotifications(
  requests: readonly WorkflowRequest[],
  actor: Actor,
  now: Date,
): AppNotification[] {
  const notifications: AppNotification[] = [];
  for (const request of requests) {
    const isOwn = request.requester === actor.name;
    const kind =
      actor.role === 'requester' || isOwn
        ? ownOutcome(request)
        : availableActions(request, actor).length > 0
          ? taskKind(request, now)
          : null;
    if (!kind || (actor.role === 'requester' && !isOwn)) continue;
    notifications.push({
      id: `${request.id}:${kind}`,
      kind,
      requestId: request.id,
      code: request.code,
      title: request.title,
      at: request.updatedAt,
    });
  }
  return notifications
    .sort((a, b) => SEVERITY[a.kind] - SEVERITY[b.kind] || b.at.localeCompare(a.at))
    .slice(0, MAX_NOTIFICATIONS);
}
