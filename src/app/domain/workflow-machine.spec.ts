import { Actor, RequestStatus, Role, WorkflowAction } from './request.model';
import { FIXED_NOW, buildRequest } from './testing/request-fixture';
import {
  TransitionError,
  applyTransition,
  availableActions,
  checkTransition,
  requiresComment,
} from './workflow-machine';

const actor = (role: Role, name = `${role}-user`): Actor => ({ role, name });
const ctx = (role: Role, comment?: string) => ({ actor: actor(role), now: FIXED_NOW, comment });

describe('workflow state machine', () => {
  describe('happy paths', () => {
    const cases: readonly [RequestStatus, WorkflowAction, Role, RequestStatus, string?][] = [
      ['draft', 'submit', 'requester', 'in_review'],
      ['in_review', 'return', 'reviewer', 'returned', 'Falta orçamento'],
      ['returned', 'resubmit', 'requester', 'in_review'],
      ['in_review', 'approve', 'approver', 'approved'],
      ['in_review', 'reject', 'reviewer', 'rejected', 'Fora da política'],
      ['in_review', 'reject', 'approver', 'rejected', 'Sem verba'],
      ['approved', 'complete', 'approver', 'completed'],
      ['approved', 'complete', 'admin', 'completed'],
    ];

    it.each(cases)('%s --%s(%s)--> %s', (from, action, role, to, comment) => {
      // Enviar e reenviar são do dono: o solicitante do teste é o criador da solicitação.
      const owner = role === 'requester' ? { requester: actor(role).name } : {};
      const result = applyTransition(buildRequest({ status: from, ...owner }), action, ctx(role, comment));
      expect(result.ok && result.value.status).toBe(to);
    });
  });

  it('rejects transitions from the wrong state', () => {
    const error = checkTransition(buildRequest({ status: 'draft' }), 'approve', ctx('approver'));
    expect(error).toBe<TransitionError>('invalid_transition');
  });

  it('rejects roles without permission', () => {
    const request = buildRequest({ status: 'in_review' });
    expect(checkTransition(request, 'approve', ctx('reviewer'))).toBe('forbidden');
    expect(checkTransition(request, 'reject', ctx('auditor', 'x'))).toBe('forbidden');
  });

  it('enforces segregation of duties even for admin', () => {
    const request = buildRequest({ status: 'in_review', requester: 'admin-user' });
    expect(checkTransition(request, 'approve', ctx('admin'))).toBe('separation_of_duties');
  });

  it('requires a comment to return or reject', () => {
    const request = buildRequest({ status: 'in_review' });
    expect(checkTransition(request, 'return', ctx('reviewer', '   '))).toBe('comment_required');
    expect(checkTransition(request, 'reject', ctx('approver'))).toBe('comment_required');
  });

  describe('SLA guard', () => {
    const breached = buildRequest({ status: 'in_review', dueAt: '2026-11-18T00:00:00.000Z' });

    it('requires justification to approve after the deadline', () => {
      expect(requiresComment(breached, 'approve', FIXED_NOW)).toBe(true);
      expect(checkTransition(breached, 'approve', ctx('approver'))).toBe('justification_required');
    });

    it('accepts approval after the deadline with justification', () => {
      const result = applyTransition(breached, 'approve', ctx('approver', 'Urgência do cliente'));
      expect(result.ok).toBe(true);
    });

    it('does not require justification within the deadline', () => {
      expect(requiresComment(buildRequest({ status: 'in_review' }), 'approve', FIXED_NOW)).toBe(
        false,
      );
    });
  });

  describe('audit trail', () => {
    it('appends an immutable entry and leaves the original untouched', () => {
      const original = buildRequest({ status: 'in_review' });
      const result = applyTransition(original, 'return', ctx('reviewer', '  Anexar NF  '));
      if (!result.ok) throw new Error(result.error);

      const [entry] = result.value.audit;
      expect(original.audit).toHaveLength(0);
      expect(original.status).toBe('in_review');
      expect(entry).toMatchObject({
        id: 'req-1-1',
        action: 'return',
        from: 'in_review',
        to: 'returned',
        actor: 'reviewer-user',
        role: 'reviewer',
        comment: 'Anexar NF',
        at: FIXED_NOW.toISOString(),
      });
      expect(Object.isFrozen(result.value.audit)).toBe(true);
      expect(Object.isFrozen(entry)).toBe(true);
    });

    it('does not create an entry when the transition fails', () => {
      const result = applyTransition(buildRequest(), 'approve', ctx('approver'));
      expect(result).toEqual({ ok: false, error: 'invalid_transition' });
    });
  });

  describe('availableActions', () => {
    it.each([
      ['draft', 'requester', ['submit']],
      ['in_review', 'reviewer', ['return', 'reject']],
      ['in_review', 'approver', ['approve', 'reject']],
      ['in_review', 'auditor', []],
      ['returned', 'requester', ['resubmit']],
      ['approved', 'admin', ['complete']],
      ['completed', 'admin', []],
    ] as const)('%s as %s → %j', (status, role, expected) => {
      const owner = role === 'requester' ? { requester: actor(role).name } : {};
      expect(availableActions(buildRequest({ status, ...owner }), actor(role))).toEqual(expected);
    });

    it('hides segregated actions from the requester acting as reviewer', () => {
      const request = buildRequest({ status: 'in_review', requester: 'Ana Souza' });
      expect(availableActions(request, { role: 'admin', name: 'Ana Souza' })).toEqual([]);
    });
  });
});
