import { buildRequest } from '../../../domain/testing/request-fixture';
import { countByStatus, nextSort, sortRequests } from './request-sort';

const a = buildRequest({
  id: 'a',
  code: 'OPS-0002',
  title: 'Beta',
  amount: 50,
  priority: 'low',
  status: 'approved',
});
const b = buildRequest({
  id: 'b',
  code: 'OPS-0010',
  title: 'alfa',
  amount: 900,
  priority: 'high',
  status: 'draft',
});
const c = buildRequest({
  id: 'c',
  code: 'OPS-0001',
  title: 'Gama',
  amount: 10,
  priority: 'medium',
  status: 'draft',
});

const ids = (items: readonly { id: string }[]) => items.map((item) => item.id);

describe('sortRequests', () => {
  it('keeps the incoming order without a sort state', () => {
    expect(ids(sortRequests([a, b, c], null))).toEqual(['a', 'b', 'c']);
  });

  it('sorts codes numerically, not lexically', () => {
    expect(ids(sortRequests([a, b, c], { key: 'code', direction: 'asc' }))).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('sorts titles ignoring case', () => {
    expect(ids(sortRequests([a, b, c], { key: 'title', direction: 'asc' }))).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  it('sorts amounts descending', () => {
    expect(ids(sortRequests([a, b, c], { key: 'amount', direction: 'desc' }))).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  it('orders priority from low to high', () => {
    expect(ids(sortRequests([a, b, c], { key: 'priority', direction: 'asc' }))).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('does not mutate the input', () => {
    const input = [a, b, c];
    sortRequests(input, { key: 'amount', direction: 'asc' });
    expect(ids(input)).toEqual(['a', 'b', 'c']);
  });
});

describe('nextSort', () => {
  it('cycles ascending, descending and off for the same column', () => {
    const first = nextSort(null, 'amount');
    const second = nextSort(first, 'amount');
    expect(first).toEqual({ key: 'amount', direction: 'asc' });
    expect(second).toEqual({ key: 'amount', direction: 'desc' });
    expect(nextSort(second, 'amount')).toBeNull();
  });

  it('starts ascending when another column is chosen', () => {
    expect(nextSort({ key: 'amount', direction: 'desc' }, 'code')).toEqual({
      key: 'code',
      direction: 'asc',
    });
  });
});

describe('countByStatus', () => {
  it('counts every status and the total', () => {
    const counts = countByStatus([a, b, c]);
    expect(counts).toMatchObject({ all: 3, draft: 2, approved: 1, in_review: 0, completed: 0 });
  });
});
