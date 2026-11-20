import { Actor } from '../../domain/request.model';
import { FIXED_NOW } from '../../domain/testing/request-fixture';
import { MockDatabase } from './mock-database';

const ANA: Actor = { name: 'Ana Souza', role: 'requester' };
const MARINA: Actor = { name: 'Marina Costa', role: 'requester' };
const BRUNO: Actor = { name: 'Bruno Lima', role: 'reviewer' };
const CARLA: Actor = { name: 'Carla Mendes', role: 'approver' };
const DIEGO: Actor = { name: 'Diego Rocha', role: 'auditor' };

const input = {
  title: 'Notebooks para o time',
  description: 'Compra de 3 notebooks',
  category: 'purchase' as const,
  priority: 'medium' as const,
  amount: 15000,
  dueAt: '2027-01-20T12:00:00.000Z',
  documents: [],
};

function database() {
  return new MockDatabase(FIXED_NOW);
}

describe('MockDatabase visibility', () => {
  it('shows a requester only their own requests', () => {
    const items = database().list({}, ANA);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.requester === ANA.name)).toBe(true);
  });

  it('shows everything to reviewers, approvers and auditors', () => {
    const db = database();
    expect(db.list({}, CARLA).length).toBeGreaterThan(db.list({}, ANA).length);
    expect(db.list({}, DIEGO).length).toBe(db.list({}, CARLA).length);
  });

  it('strips the audit trail for roles without audit.view', () => {
    const db = database();
    expect(db.list({}, ANA).every((item) => item.audit.length === 0)).toBe(true);
    expect(db.list({}, CARLA).some((item) => item.audit.length > 0)).toBe(true);
  });

  it('answers forbidden when a requester opens someone else request', () => {
    expect(database().get('req-1', ANA)).toEqual({ ok: false, error: 'forbidden' });
  });

  it('answers not_found for an unknown id', () => {
    expect(database().get('req-9999', CARLA)).toEqual({ ok: false, error: 'not_found' });
  });
});

describe('MockDatabase create', () => {
  it('lets a requester create and submit in one step', () => {
    const result = database().create(input, ANA, FIXED_NOW, true);
    expect(result.ok && result.value.status).toBe('in_review');
  });

  it('refuses roles without request.create and stores nothing', () => {
    const db = database();
    const before = db.list({}, CARLA).length;
    expect(db.create(input, BRUNO, FIXED_NOW, false)).toEqual({ ok: false, error: 'forbidden' });
    expect(db.list({}, CARLA)).toHaveLength(before);
  });

  it('assigns increasing codes', () => {
    const db = database();
    const first = db.create(input, ANA, FIXED_NOW, false);
    const second = db.create(input, ANA, FIXED_NOW, false);
    expect(first.ok && second.ok && first.value.code < second.value.code).toBe(true);
  });
});

describe('MockDatabase transitions', () => {
  it('is forbidden for a requester acting on someone else request', () => {
    const result = database().transition(
      'req-1',
      { action: 'approve', expectedStatus: 'in_review' },
      ANA,
      FIXED_NOW,
    );
    expect(result).toEqual({ ok: false, error: 'forbidden' });
  });

  it('is forbidden for a role without the permission', () => {
    const result = database().transition(
      'req-1',
      { action: 'approve', expectedStatus: 'in_review' },
      BRUNO,
      FIXED_NOW,
    );
    expect(result).toEqual({ ok: false, error: 'forbidden' });
  });

  it('reports conflict when the status changed', () => {
    const result = database().transition(
      'req-6',
      { action: 'approve', expectedStatus: 'in_review' },
      CARLA,
      FIXED_NOW,
    );
    expect(result).toEqual({ ok: false, error: 'conflict' });
  });

  it('reports conflict on an A-B-A change (same status, different version)', () => {
    const db = database();
    const seen = db.get('req-1', CARLA);
    if (!seen.ok) throw new Error('req-1 missing');
    const later = new Date(FIXED_NOW.getTime() + 60_000);
    db.transition(
      'req-1',
      { action: 'return', expectedStatus: 'in_review', comment: 'Ajuste' },
      BRUNO,
      later,
    );
    db.transition(
      'req-1',
      { action: 'resubmit', expectedStatus: 'returned' },
      MARINA,
      new Date(later.getTime() + 60_000),
    );
    const stale = db.transition(
      'req-1',
      {
        action: 'approve',
        expectedStatus: 'in_review',
        expectedUpdatedAt: seen.value.updatedAt,
      },
      CARLA,
      new Date(later.getTime() + 120_000),
    );
    expect(stale).toEqual({ ok: false, error: 'conflict' });
  });

  it('answers not_found for an unknown request', () => {
    const result = database().transition(
      'req-9999',
      { action: 'approve', expectedStatus: 'in_review' },
      CARLA,
      FIXED_NOW,
    );
    expect(result).toEqual({ ok: false, error: 'not_found' });
  });

  it('applies a valid transition and records it', () => {
    const result = database().transition(
      'req-1',
      { action: 'approve', expectedStatus: 'in_review', comment: 'Ok' },
      CARLA,
      FIXED_NOW,
    );
    expect(result.ok && result.value.status).toBe('approved');
  });
});

describe('MockDatabase documents and comments', () => {
  it('lets the owner attach files while the request is a draft', () => {
    const result = database().addDocument('req-9', ANA, 'cotacao.pdf');
    expect(result.ok && result.value.documents).toContain('cotacao.pdf');
  });

  it('refuses attachments once the request is in review', () => {
    expect(database().addDocument('req-1', MARINA, 'x.pdf')).toEqual({
      ok: false,
      error: 'invalid_state',
    });
  });

  it('refuses attachments from someone who is not the owner', () => {
    expect(database().addDocument('req-9', MARINA, 'x.pdf')).toEqual({
      ok: false,
      error: 'forbidden',
    });
  });

  it('rejects names that sanitize to nothing', () => {
    expect(database().addDocument('req-9', ANA, '///')).toEqual({
      ok: false,
      error: 'invalid_document',
    });
  });

  it('keeps auditors read-only on comments', () => {
    expect(database().addComment('req-1', DIEGO, 'oi', FIXED_NOW)).toEqual({
      ok: false,
      error: 'forbidden',
    });
  });

  it('rejects empty comments and accepts normal ones', () => {
    const db = database();
    expect(db.addComment('req-1', CARLA, '   ', FIXED_NOW)).toEqual({
      ok: false,
      error: 'empty_comment',
    });
    const added = db.addComment('req-1', CARLA, 'Tudo certo.', FIXED_NOW);
    expect(added.ok && added.value.author).toBe('Carla Mendes');
  });

  it('hides a thread from requesters who do not own the request', () => {
    expect(database().listComments('req-1', ANA)).toEqual({ ok: false, error: 'forbidden' });
  });
});
