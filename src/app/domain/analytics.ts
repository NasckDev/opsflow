import { AuditEntry, RequestStatus, Role, WorkflowRequest } from './request.model';
import { AT_RISK_THRESHOLD_HOURS } from './sla';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const HOUR_MS = 3_600_000;
export const DEFAULT_WEEKS = 8;

export interface WeekPoint {
  /** Segunda-feira (UTC) que abre a semana, em ISO. */
  readonly weekStart: string;
  readonly created: number;
  readonly decided: number;
}

export interface SlaSummary {
  readonly onTime: number;
  readonly late: number;
  readonly openBreached: number;
  readonly openAtRisk: number;
  /** 0 a 1; null quando ainda não há decisões. */
  readonly complianceRate: number | null;
}

export interface StageDuration {
  readonly status: RequestStatus;
  readonly averageHours: number;
  readonly samples: number;
}

export interface RoleActivity {
  readonly role: Role;
  readonly actions: number;
}

export interface Analytics {
  readonly throughput: readonly WeekPoint[];
  readonly sla: SlaSummary;
  readonly bottleneck: readonly StageDuration[];
  readonly byRole: readonly RoleActivity[];
  readonly total: number;
  readonly open: number;
}

const OPEN_STATUSES: readonly RequestStatus[] = ['draft', 'in_review', 'returned'];
const STAGES: readonly RequestStatus[] = ['draft', 'in_review', 'returned', 'approved'];
const DECISIONS = ['approve', 'reject'];

export function startOfWeek(date: Date): number {
  const day = (date.getUTCDay() + 6) % 7; // segunda = 0
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - day * DAY_MS;
}

function weeklyThroughput(
  requests: readonly WorkflowRequest[],
  now: Date,
  weeks: number,
): WeekPoint[] {
  const lastStart = startOfWeek(now);
  const starts = Array.from(
    { length: weeks },
    (_, index) => lastStart - (weeks - 1 - index) * WEEK_MS,
  );
  const created = new Map(starts.map((start) => [start, 0]));
  const decided = new Map(starts.map((start) => [start, 0]));
  const bump = (bucket: Map<number, number>, iso: string) => {
    const key = startOfWeek(new Date(iso));
    if (bucket.has(key)) bucket.set(key, (bucket.get(key) ?? 0) + 1);
  };
  for (const request of requests) {
    bump(created, request.createdAt);
    request.audit
      .filter((entry) => DECISIONS.includes(entry.action))
      .forEach((entry) => bump(decided, entry.at));
  }
  return starts.map((start) => ({
    weekStart: new Date(start).toISOString(),
    created: created.get(start) ?? 0,
    decided: decided.get(start) ?? 0,
  }));
}

function slaSummary(requests: readonly WorkflowRequest[], now: Date): SlaSummary {
  let onTime = 0;
  let late = 0;
  let openBreached = 0;
  let openAtRisk = 0;
  for (const request of requests) {
    const decision = request.audit.find((entry) => DECISIONS.includes(entry.action));
    if (decision) {
      if (Date.parse(decision.at) <= Date.parse(request.dueAt)) onTime += 1;
      else late += 1;
    } else if (OPEN_STATUSES.includes(request.status)) {
      const hours = (Date.parse(request.dueAt) - now.getTime()) / HOUR_MS;
      if (hours < 0) openBreached += 1;
      else if (hours < AT_RISK_THRESHOLD_HOURS) openAtRisk += 1;
    }
  }
  const decided = onTime + late;
  return {
    onTime,
    late,
    openBreached,
    openAtRisk,
    complianceRate: decided ? onTime / decided : null,
  };
}

/** Horas que cada solicitação passou em cada etapa; etapa corrente conta até agora. */
function stageDurations(requests: readonly WorkflowRequest[], now: Date): StageDuration[] {
  const totals = new Map<RequestStatus, { hours: number; samples: number }>();
  const add = (status: RequestStatus, hours: number) => {
    const current = totals.get(status) ?? { hours: 0, samples: 0 };
    totals.set(status, { hours: current.hours + hours, samples: current.samples + 1 });
  };
  for (const request of requests) {
    const trail: readonly AuditEntry[] = request.audit;
    trail.forEach((entry, index) => {
      if (!STAGES.includes(entry.to)) return;
      const next = trail[index + 1];
      const isOpenTail = !next && STAGES.includes(request.status);
      if (!next && !isOpenTail) return;
      const end = next ? Date.parse(next.at) : now.getTime();
      add(entry.to, Math.max(0, end - Date.parse(entry.at)) / HOUR_MS);
    });
  }
  return STAGES.map((status) => {
    const total = totals.get(status);
    return {
      status,
      averageHours: total ? total.hours / total.samples : 0,
      samples: total?.samples ?? 0,
    };
  });
}

function roleActivity(requests: readonly WorkflowRequest[]): RoleActivity[] {
  const counts = new Map<Role, number>();
  for (const request of requests) {
    for (const entry of request.audit) {
      if (entry.action === 'create' || entry.action === 'migrate') continue;
      counts.set(entry.role, (counts.get(entry.role) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([role, actions]) => ({ role, actions }))
    .sort((a, b) => b.actions - a.actions);
}

export function computeAnalytics(
  requests: readonly WorkflowRequest[],
  now: Date,
  weeks = DEFAULT_WEEKS,
): Analytics {
  return {
    throughput: weeklyThroughput(requests, now, weeks),
    sla: slaSummary(requests, now),
    bottleneck: stageDurations(requests, now),
    byRole: roleActivity(requests),
    total: requests.length,
    open: requests.filter((request) => OPEN_STATUSES.includes(request.status)).length,
  };
}
