import {
  PRIORITIES,
  REQUEST_STATUSES,
  RequestStatus,
  WorkflowRequest,
} from '../../../domain/request.model';

export type SortKey = 'code' | 'title' | 'requester' | 'status' | 'priority' | 'amount' | 'dueAt';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  readonly key: SortKey;
  readonly direction: SortDirection;
}

export type StatusCounts = Readonly<Record<RequestStatus | 'all', number>>;

function compare(a: WorkflowRequest, b: WorkflowRequest, key: SortKey): number {
  switch (key) {
    case 'amount':
      return a.amount - b.amount;
    case 'dueAt':
      return Date.parse(a.dueAt) - Date.parse(b.dueAt);
    case 'status':
      return REQUEST_STATUSES.indexOf(a.status) - REQUEST_STATUSES.indexOf(b.status);
    case 'priority':
      return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
    default:
      return a[key].localeCompare(b[key], 'pt-BR', { numeric: true, sensitivity: 'base' });
  }
}

/** Devolve uma cópia ordenada; sem estado de ordenação, mantém a ordem recebida. */
export function sortRequests(
  items: readonly WorkflowRequest[],
  sort: SortState | null,
): WorkflowRequest[] {
  if (!sort) return [...items];
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => factor * compare(a, b, sort.key));
}

/** Ciclo do cabeçalho: ascendente, descendente e depois sem ordenação. */
export function nextSort(current: SortState | null, key: SortKey): SortState | null {
  if (current?.key !== key) return { key, direction: 'asc' };
  return current.direction === 'asc' ? { key, direction: 'desc' } : null;
}

export function countByStatus(items: readonly WorkflowRequest[]): StatusCounts {
  const counts = { all: items.length } as Record<RequestStatus | 'all', number>;
  for (const status of REQUEST_STATUSES) counts[status] = 0;
  for (const item of items) counts[item.status] += 1;
  return counts;
}
