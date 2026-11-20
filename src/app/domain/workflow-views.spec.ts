import { computeAnalytics, startOfWeek } from './analytics';
import { buildApprovalChain } from './approval-chain';
import { actionForMove } from './board';
import { canBatchApprove, inboxTasks } from './inbox';
import { buildNotifications } from './notifications';
import { Actor, WorkflowAction, WorkflowRequest } from './request.model';
import { FIXED_NOW, buildRequest } from './testing/request-fixture';
import { applyTransition } from './workflow-machine';

const ANA: Actor = { name: 'Ana Souza', role: 'requester' };
const BRUNO: Actor = { name: 'Bruno Lima', role: 'reviewer' };
const CARLA: Actor = { name: 'Carla Mendes', role: 'approver' };
const HOUR = 3_600_000;
const at = (hours: number) => new Date(FIXED_NOW.getTime() + hours * HOUR);

function walk(
  request: WorkflowRequest,
  steps: readonly [WorkflowAction, Actor, number, string?][],
): WorkflowRequest {
  return steps.reduce((current, [action, actor, hours, comment]) => {
    const result = applyTransition(current, action, { actor, now: at(hours), comment });
    if (!result.ok) throw new Error(`step ${action} failed: ${result.error}`);
    return result.value;
  }, request);
}

const draft = (overrides: Partial<WorkflowRequest> = {}) =>
  buildRequest({ requester: ANA.name, createdAt: at(-72).toISOString(), ...overrides });

describe('buildApprovalChain', () => {
  it('starts at the request step for a draft', () => {
    const chain = buildApprovalChain(draft());
    expect(chain.map((step) => step.state)).toEqual(['current', 'pending', 'pending', 'pending']);
  });

  it('shows only approval as in progress, with review optional, while in review', () => {
    const request = walk(draft(), [['submit', ANA, -60]]);
    expect(buildApprovalChain(request).map((step) => step.state)).toEqual([
      'done',
      'optional',
      'current',
      'pending',
    ]);
  });

  it('marks the review step as returned with the reviewer who returned it', () => {
    const request = walk(draft(), [
      ['submit', ANA, -60],
      ['return', BRUNO, -50, 'Falta cotação'],
    ]);
    const review = buildApprovalChain(request)[1];
    expect(review).toMatchObject({ state: 'returned', actor: 'Bruno Lima' });
  });

  it('completes the chain after approval and completion', () => {
    const request = walk(draft(), [
      ['submit', ANA, -60],
      ['approve', CARLA, -40],
      ['complete', CARLA, -20],
    ]);
    const chain = buildApprovalChain(request);
    expect(chain.map((step) => step.state)).toEqual(['done', 'skipped', 'done', 'done']);
    expect(chain[2].actor).toBe('Carla Mendes');
  });

  it('marks approval as rejected when the approver rejects', () => {
    const request = walk(draft(), [
      ['submit', ANA, -60],
      ['reject', CARLA, -40, 'Fora do orçamento'],
    ]);
    expect(buildApprovalChain(request)[2]).toMatchObject({
      state: 'rejected',
      actor: 'Carla Mendes',
    });
  });
});

describe('actionForMove', () => {
  it.each([
    ['draft', 'in_review', 'submit'],
    ['in_review', 'approved', 'approve'],
    ['in_review', 'rejected', 'reject'],
    ['in_review', 'returned', 'return'],
    ['returned', 'in_review', 'resubmit'],
    ['approved', 'completed', 'complete'],
  ] as const)('%s → %s is %s', (from, to, action) => {
    expect(actionForMove(from, to)).toBe(action);
  });

  it.each([
    ['draft', 'approved'],
    ['rejected', 'in_review'],
    ['completed', 'draft'],
    ['in_review', 'in_review'],
  ] as const)('%s → %s is not a valid move', (from, to) => {
    expect(actionForMove(from, to)).toBeNull();
  });
});

describe('inboxTasks', () => {
  const review = walk(draft({ id: 'r1', dueAt: at(10).toISOString() }), [['submit', ANA, -60]]);
  const later = walk(draft({ id: 'r2', dueAt: at(100).toISOString() }), [['submit', ANA, -60]]);
  const others = draft({ id: 'r3', requester: 'Outra Pessoa' });

  it('lists in-review requests for the approver ordered by deadline', () => {
    const tasks = inboxTasks([later, review, others], CARLA, FIXED_NOW);
    expect(tasks.map((task) => task.request.id)).toEqual(['r1', 'r2']);
  });

  it('shows requesters only their own drafts', () => {
    const tasks = inboxTasks([review, others, draft({ id: 'mine' })], ANA, FIXED_NOW);
    expect(tasks.map((task) => task.request.id)).toEqual(['mine']);
  });

  it('is empty for read-only roles', () => {
    const auditor: Actor = { name: 'Diego Rocha', role: 'auditor' };
    expect(inboxTasks([review, later], auditor, FIXED_NOW)).toEqual([]);
  });

  it('excludes breached items from batch approval', () => {
    const breached = walk(draft({ id: 'b', dueAt: at(-5).toISOString() }), [['submit', ANA, -60]]);
    const [task] = inboxTasks([breached], CARLA, FIXED_NOW);
    expect(canBatchApprove(task)).toBe(false);
    const [ok] = inboxTasks([review], CARLA, FIXED_NOW);
    expect(canBatchApprove(ok)).toBe(true);
  });
});

describe('buildNotifications', () => {
  it('flags breached and at-risk tasks first for an approver', () => {
    const breached = walk(draft({ id: 'b', dueAt: at(-5).toISOString() }), [['submit', ANA, -60]]);
    const risk = walk(draft({ id: 'k', dueAt: at(6).toISOString() }), [['submit', ANA, -60]]);
    const calm = walk(draft({ id: 'c', dueAt: at(200).toISOString() }), [['submit', ANA, -60]]);
    const kinds = buildNotifications([calm, risk, breached], CARLA, FIXED_NOW).map(
      (item) => item.kind,
    );
    expect(kinds).toEqual(['sla_breached', 'sla_at_risk', 'task']);
  });

  it('tells the requester about returned and approved own requests', () => {
    const returned = walk(draft({ id: 'ret' }), [
      ['submit', ANA, -60],
      ['return', BRUNO, -50, 'Ajuste'],
    ]);
    const approved = walk(draft({ id: 'ok' }), [
      ['submit', ANA, -60],
      ['approve', CARLA, -50],
    ]);
    const kinds = buildNotifications([approved, returned], ANA, FIXED_NOW).map((item) => item.kind);
    expect(kinds).toEqual(['returned', 'approved']);
  });
});

describe('computeAnalytics', () => {
  const week = 7 * 24;
  const onTime = walk(
    draft({ id: 'a', createdAt: at(-30).toISOString(), dueAt: at(40).toISOString() }),
    [
      ['submit', ANA, -28],
      ['approve', CARLA, -4],
    ],
  );
  const late = walk(
    draft({ id: 'b', createdAt: at(-week - 50).toISOString(), dueAt: at(-week).toISOString() }),
    [
      ['submit', ANA, -week - 48],
      ['reject', CARLA, -week + 10, 'Sem verba'],
    ],
  );
  const openBreached = walk(draft({ id: 'c', dueAt: at(-3).toISOString() }), [
    ['submit', ANA, -20],
  ]);

  it('counts creations and decisions per week', () => {
    const { throughput } = computeAnalytics([onTime, late], FIXED_NOW);
    expect(throughput).toHaveLength(8);
    const decided = throughput.reduce((sum, point) => sum + point.decided, 0);
    expect(decided).toBe(2);
    expect(startOfWeek(FIXED_NOW)).toBe(Date.parse(throughput[7].weekStart));
  });

  it('computes SLA compliance and open breaches', () => {
    const { sla } = computeAnalytics([onTime, late, openBreached], FIXED_NOW);
    expect(sla).toMatchObject({ onTime: 1, late: 1, openBreached: 1 });
    expect(sla.complianceRate).toBeCloseTo(0.5);
  });

  it('reports null compliance when nothing was decided', () => {
    expect(computeAnalytics([openBreached], FIXED_NOW).sla.complianceRate).toBeNull();
  });

  it('measures average time in review', () => {
    const { bottleneck } = computeAnalytics([onTime], FIXED_NOW);
    const review = bottleneck.find((stage) => stage.status === 'in_review');
    expect(review?.averageHours).toBeCloseTo(24);
  });

  it('counts actions per role without create entries', () => {
    const { byRole } = computeAnalytics([onTime], FIXED_NOW);
    expect(byRole).toEqual(
      expect.arrayContaining([
        { role: 'requester', actions: 1 },
        { role: 'approver', actions: 1 },
      ]),
    );
  });
});

describe('inbox stages and ownership', () => {
  it('moves an approved request to the conclude stage for the approver', () => {
    const approved = walk(draft({ id: 'ap' }), [
      ['submit', ANA, -60],
      ['approve', CARLA, -40],
    ]);
    const [task] = inboxTasks([approved], CARLA, FIXED_NOW);
    expect(task).toMatchObject({ stage: 'conclude', actions: ['complete'] });
  });

  it('keeps in-review requests in the todo stage', () => {
    const review = walk(draft({ id: 'rv' }), [['submit', ANA, -60]]);
    expect(inboxTasks([review], CARLA, FIXED_NOW)[0].stage).toBe('todo');
  });

  it('does not let a requester submit someone else draft', () => {
    const other = draft({ id: 'o', requester: 'Outra Pessoa' });
    const result = applyTransition(other, 'submit', { actor: ANA, now: FIXED_NOW });
    expect(result).toEqual({ ok: false, error: 'not_owner' });
  });

  it('lets an admin submit on behalf of the owner (explicit rule)', () => {
    const admin: Actor = { name: 'Elisa Prado', role: 'admin' };
    expect(applyTransition(draft({ id: 'x' }), 'submit', { actor: admin, now: FIXED_NOW }).ok).toBe(true);
  });
});
