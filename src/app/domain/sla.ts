import { RequestStatus, WorkflowRequest } from './request.model';

export const AT_RISK_THRESHOLD_HOURS = 24;
const MS_PER_HOUR = 3_600_000;
const CLOSED_STATUSES: readonly RequestStatus[] = ['rejected', 'completed'];

export type SlaState = 'on_track' | 'at_risk' | 'breached' | 'closed';

export interface SlaEvaluation {
  readonly state: SlaState;
  readonly hoursRemaining: number;
}

export function evaluateSla(
  request: Pick<WorkflowRequest, 'dueAt' | 'status'>,
  now: Date,
): SlaEvaluation {
  const hoursRemaining = Math.floor((Date.parse(request.dueAt) - now.getTime()) / MS_PER_HOUR);
  if (CLOSED_STATUSES.includes(request.status)) {
    return { state: 'closed', hoursRemaining };
  }
  if (hoursRemaining < 0) {
    return { state: 'breached', hoursRemaining };
  }
  if (hoursRemaining < AT_RISK_THRESHOLD_HOURS) {
    return { state: 'at_risk', hoursRemaining };
  }
  return { state: 'on_track', hoursRemaining };
}

/**
 * Fração do prazo já consumida (0 a 1): do `createdAt` até o `dueAt`.
 * Solicitações encerradas contam como 1; prazo inválido ou zerado também.
 */
export function slaElapsedRatio(
  request: Pick<WorkflowRequest, 'createdAt' | 'dueAt' | 'status'>,
  now: Date,
): number {
  if (CLOSED_STATUSES.includes(request.status)) return 1;
  const start = Date.parse(request.createdAt);
  const total = Date.parse(request.dueAt) - start;
  if (!Number.isFinite(total) || total <= 0) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - start) / total));
}

/** Formata horas como "5h" ou "3d 4h" (unidades universais, sem tradução). */
export function formatHours(hours: number): string {
  const total = Math.max(0, Math.round(hours));
  if (total < 24) return `${total}h`;
  const days = Math.floor(total / 24);
  const rest = total % 24;
  return rest === 0 ? `${days}d` : `${days}d ${rest}h`;
}
