import { InboxStage, InboxTask } from '../../domain/inbox';
import { CATEGORIES, Category, PRIORITIES, Priority } from '../../domain/request.model';

export interface InboxFilter {
  /** "todo": falta decidir ou enviar. "conclude": já aprovada, falta concluir. */
  readonly stage: InboxStage;
  /** Só o que está vencido ou perto de vencer. */
  readonly urgentOnly: boolean;
  readonly priority: Priority | 'any';
  readonly category: Category | 'any';
}

export interface SavedFilter {
  readonly id: string;
  readonly name: string;
  readonly filter: InboxFilter;
}

export const NO_FILTER: InboxFilter = {
  stage: 'todo',
  urgentOnly: false,
  priority: 'any',
  category: 'any',
};
export const SAVED_FILTERS_KEY = 'opsflow.inbox.filters';
export const MAX_SAVED_FILTERS = 8;
const NAME_MAX = 24;

export interface FilterPreset {
  readonly id: string;
  readonly label: string;
  readonly filter: InboxFilter;
}

export const PRESET_FILTERS: readonly FilterPreset[] = [
  { id: 'all', label: 'inbox.preset.all', filter: NO_FILTER },
  { id: 'urgent', label: 'inbox.preset.urgent', filter: { ...NO_FILTER, urgentOnly: true } },
  { id: 'high', label: 'inbox.preset.high', filter: { ...NO_FILTER, priority: 'high' } },
  {
    id: 'contracts',
    label: 'inbox.preset.contracts',
    filter: { ...NO_FILTER, category: 'contract' },
  },
  { id: 'conclude', label: 'inbox.preset.conclude', filter: { ...NO_FILTER, stage: 'conclude' } },
];

export function sameFilter(a: InboxFilter, b: InboxFilter): boolean {
  return (
    a.stage === b.stage &&
    a.urgentOnly === b.urgentOnly &&
    a.priority === b.priority &&
    a.category === b.category
  );
}

export function applyInboxFilter(tasks: readonly InboxTask[], filter: InboxFilter): InboxTask[] {
  return tasks.filter(({ request, sla, stage }) => {
    if (stage !== filter.stage) return false;
    if (filter.urgentOnly && sla.state !== 'breached' && sla.state !== 'at_risk') return false;
    if (filter.priority !== 'any' && request.priority !== filter.priority) return false;
    return filter.category === 'any' || request.category === filter.category;
  });
}

function isPriority(value: unknown): value is Priority | 'any' {
  return value === 'any' || PRIORITIES.some((item) => item === value);
}

function isCategory(value: unknown): value is Category | 'any' {
  return value === 'any' || CATEGORIES.some((item) => item === value);
}

/** Lê os filtros salvos descartando qualquer item inválido (o storage é entrada não confiável). */
export function parseSavedFilters(raw: string | null): SavedFilter[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const result: SavedFilter[] = [];
  for (const item of parsed as unknown[]) {
    if (typeof item !== 'object' || item === null) continue;
    const { id, name, filter } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof name !== 'string') continue;
    if (typeof filter !== 'object' || filter === null) continue;
    const { urgentOnly, priority, category, stage } = filter as Record<string, unknown>;
    if (typeof urgentOnly !== 'boolean' || !isPriority(priority) || !isCategory(category)) continue;
    result.push({
      id,
      name: name.slice(0, NAME_MAX),
      filter: { stage: stage === 'conclude' ? 'conclude' : 'todo', urgentOnly, priority, category },
    });
  }
  return result.slice(0, MAX_SAVED_FILTERS);
}

export function addSavedFilter(
  saved: readonly SavedFilter[],
  name: string,
  filter: InboxFilter,
): SavedFilter[] {
  const clean = name.trim().slice(0, NAME_MAX);
  if (!clean || sameFilter(filter, NO_FILTER)) return [...saved];
  const entry: SavedFilter = {
    id: `f-${saved.length + 1}-${clean.toLowerCase()}`,
    name: clean,
    filter,
  };
  return [...saved.filter((item) => item.name !== clean), entry].slice(-MAX_SAVED_FILTERS);
}
