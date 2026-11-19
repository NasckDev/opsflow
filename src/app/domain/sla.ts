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
