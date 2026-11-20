import { appendAuditEntry, createAuditEntry } from './audit';
import { AT_RISK_THRESHOLD_HOURS, evaluateSla, slaOutcome } from './sla';
import { FIXED_NOW } from './testing/request-fixture';

const hoursFromNow = (hours: number) =>
  new Date(FIXED_NOW.getTime() + hours * 3_600_000).toISOString();

describe('evaluateSla', () => {
  it.each([
    [72, 'in_review', 'on_track'],
    [AT_RISK_THRESHOLD_HOURS, 'in_review', 'on_track'],
    [AT_RISK_THRESHOLD_HOURS - 1, 'in_review', 'at_risk'],
    [-1, 'draft', 'breached'],
    [-48, 'completed', 'closed'],
    [-48, 'approved', 'closed'],
    [-48, 'rejected', 'closed'],
  ] as const)('%ih left while %s → %s', (hours, status, state) => {
    expect(evaluateSla({ dueAt: hoursFromNow(hours), status }, FIXED_NOW).state).toBe(state);
  });

  it('reports the remaining hours', () => {
    expect(evaluateSla({ dueAt: hoursFromNow(30), status: 'draft' }, FIXED_NOW)).toEqual({
      state: 'on_track',
      hoursRemaining: 30,
    });
  });
});

describe('audit trail helpers', () => {
  const entry = createAuditEntry('a-1', {
    actor: { name: 'Bruno', role: 'reviewer' },
    action: 'return',
    from: 'in_review',
    to: 'returned',
    at: FIXED_NOW,
    comment: '   ',
  });

  it('omits blank comments', () => {
    expect('comment' in entry).toBe(false);
  });

  it('is append-only and frozen', () => {
    const empty = Object.freeze([]);
    const trail = appendAuditEntry(empty, entry);
    expect(empty).toHaveLength(0);
    expect(trail).toHaveLength(1);
    expect(() => (trail as unknown as unknown[]).push(entry)).toThrow(TypeError);
  });
});

describe('slaOutcome', () => {
  const decided = (hoursBeforeDue: number) => ({
    dueAt: hoursFromNow(0),
    audit: [
      createAuditEntry('o-1', {
        actor: { name: 'Carla', role: 'approver' },
        action: 'approve',
        from: 'in_review',
        to: 'approved',
        at: new Date(FIXED_NOW.getTime() - hoursBeforeDue * 3_600_000),
      }),
    ],
  });

  it('reports a decision made before the deadline as on time', () => {
    expect(slaOutcome(decided(5))).toEqual({ late: false, hours: 5 });
  });

  it('reports a decision made after the deadline as late', () => {
    expect(slaOutcome(decided(-3))).toEqual({ late: true, hours: 3 });
  });

  it('is null while nothing was decided', () => {
    expect(slaOutcome({ dueAt: hoursFromNow(10), audit: [] })).toBeNull();
  });
});
