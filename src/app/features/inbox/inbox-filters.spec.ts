import { InboxTask } from '../../domain/inbox';
import { evaluateSla } from '../../domain/sla';
import { FIXED_NOW, buildRequest } from '../../domain/testing/request-fixture';
import {
  MAX_SAVED_FILTERS,
  NO_FILTER,
  PRESET_FILTERS,
  addSavedFilter,
  applyInboxFilter,
  parseSavedFilters,
  sameFilter,
} from './inbox-filters';

const hours = (value: number) => new Date(FIXED_NOW.getTime() + value * 3_600_000).toISOString();

function task(
  overrides: Parameters<typeof buildRequest>[0],
  stage: InboxTask['stage'] = 'todo',
): InboxTask {
  const request = buildRequest({ status: 'in_review', ...overrides });
  return { request, stage, actions: ['approve'], sla: evaluateSla(request, FIXED_NOW) };
}

const tasks = [
  task({ id: 'a', priority: 'high', category: 'contract', dueAt: hours(5) }),
  task({ id: 'b', priority: 'low', category: 'travel', dueAt: hours(200) }),
  task({ id: 'c', priority: 'high', category: 'purchase', dueAt: hours(-3) }),
  task({ id: 'd', priority: 'medium', category: 'contract', dueAt: hours(100) }, 'conclude'),
];

const ids = (items: readonly InboxTask[]) => items.map((item) => item.request.id);

describe('applyInboxFilter', () => {
  it('shows only the todo stage by default', () => {
    expect(ids(applyInboxFilter(tasks, NO_FILTER))).toEqual(['a', 'b', 'c']);
  });

  it('shows the conclude stage on its own filter', () => {
    const conclude = PRESET_FILTERS.find((preset) => preset.id === 'conclude')!.filter;
    expect(ids(applyInboxFilter(tasks, conclude))).toEqual(['d']);
  });

  it('keeps only breached or at-risk items when urgent', () => {
    expect(ids(applyInboxFilter(tasks, { ...NO_FILTER, urgentOnly: true }))).toEqual(['a', 'c']);
  });

  it('combines priority and category', () => {
    const filter = { ...NO_FILTER, priority: 'high' as const, category: 'contract' as const };
    expect(ids(applyInboxFilter(tasks, filter))).toEqual(['a']);
  });
});

describe('sameFilter', () => {
  it('compares every field', () => {
    expect(sameFilter(NO_FILTER, { ...NO_FILTER })).toBe(true);
    expect(sameFilter(NO_FILTER, { ...NO_FILTER, stage: 'conclude' })).toBe(false);
    expect(sameFilter(NO_FILTER, { ...NO_FILTER, priority: 'low' })).toBe(false);
  });
});

describe('parseSavedFilters', () => {
  const entry = {
    id: 'f1',
    name: 'Meu filtro',
    filter: { urgentOnly: true, priority: 'high', category: 'any' },
  };

  it('reads valid entries and defaults the stage', () => {
    const [saved] = parseSavedFilters(JSON.stringify([entry]));
    expect(saved).toMatchObject({
      name: 'Meu filtro',
      filter: { stage: 'todo', urgentOnly: true },
    });
  });

  it.each([null, '', '{nope', '{}', '"x"'])('returns [] for %s', (raw) => {
    expect(parseSavedFilters(raw)).toEqual([]);
  });

  it('skips malformed entries but keeps the good ones', () => {
    const bad = { id: 1, name: 'x', filter: {} };
    const wrongEnum = { ...entry, id: 'f2', filter: { ...entry.filter, priority: 'urgent' } };
    expect(parseSavedFilters(JSON.stringify([bad, wrongEnum, entry]))).toHaveLength(1);
  });

  it('truncates names and caps the list', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      ...entry,
      id: `f${i}`,
      name: 'n'.repeat(60),
    }));
    const parsed = parseSavedFilters(JSON.stringify(many));
    expect(parsed).toHaveLength(MAX_SAVED_FILTERS);
    expect(parsed[0].name).toHaveLength(24);
  });
});

describe('addSavedFilter', () => {
  const custom = { ...NO_FILTER, priority: 'high' as const };

  it('ignores blank names and the empty filter', () => {
    expect(addSavedFilter([], '   ', custom)).toEqual([]);
    expect(addSavedFilter([], 'Vazio', NO_FILTER)).toEqual([]);
  });

  it('replaces a filter saved under the same name', () => {
    const first = addSavedFilter([], 'Alta', custom);
    const second = addSavedFilter(first, 'Alta', { ...custom, category: 'travel' });
    expect(second).toHaveLength(1);
    expect(second[0].filter.category).toBe('travel');
  });
});
