import {
  parseActor,
  parseCommentBody,
  parseCreateBody,
  parseDocumentBody,
  parseNewRequestInput,
  parseTransitionBody,
} from './validation';

const valid = {
  title: 'Notebooks para o time',
  description: '',
  category: 'purchase',
  priority: 'high',
  amount: 100,
  dueAt: '2027-01-20T12:00:00.000Z',
  documents: ['a.pdf'],
};

describe('parseNewRequestInput', () => {
  it('accepts a complete input and normalizes the date', () => {
    const result = parseNewRequestInput(valid);
    expect(result.ok && result.value.dueAt).toBe('2027-01-20T12:00:00.000Z');
  });

  it.each([
    ['title too short', { ...valid, title: 'abc' }],
    ['unknown category', { ...valid, category: 'food' }],
    ['non-positive amount', { ...valid, amount: 0 }],
    ['NaN amount', { ...valid, amount: Number.NaN }],
    ['text amount', { ...valid, amount: '10' }],
    ['absurd amount', { ...valid, amount: 5e12 }],
    ['invalid date', { ...valid, dueAt: 'ontem' }],
    ['documents not an array', { ...valid, documents: 'a.pdf' }],
    ['document that sanitizes to nothing', { ...valid, documents: ['///'] }],
    [
      'too many documents',
      { ...valid, documents: Array.from({ length: 21 }, (_, i) => `f${i}.pdf`) },
    ],
    ['null', null],
    ['an array', []],
  ])('rejects %s', (_label, raw) => {
    expect(parseNewRequestInput(raw)).toEqual({ ok: false, error: 'invalid_input' });
  });
});

describe('parseCreateBody', () => {
  it('needs a boolean submit flag', () => {
    expect(parseCreateBody({ input: valid }).ok).toBe(false);
    expect(parseCreateBody({ input: valid, submit: true }).ok).toBe(true);
  });
});

describe('parseTransitionBody', () => {
  it('accepts a known action and status', () => {
    expect(parseTransitionBody({ action: 'approve', expectedStatus: 'in_review' }).ok).toBe(true);
  });

  it.each([
    { action: 'explode', expectedStatus: 'in_review' },
    { action: 'approve', expectedStatus: 'lost' },
    { action: 'approve', expectedStatus: 'in_review', comment: 5 },
    { action: 'approve', expectedStatus: 'in_review', comment: 'x'.repeat(1001) },
    { action: 'approve', expectedStatus: 'in_review', expectedUpdatedAt: 7 },
  ])('rejects %j', (raw) => {
    expect(parseTransitionBody(raw)).toEqual({ ok: false, error: 'invalid_input' });
  });
});

describe('comment and document bodies', () => {
  it('requires strings', () => {
    expect(parseCommentBody({ body: 'oi' }).ok).toBe(true);
    expect(parseCommentBody({ body: 1 }).ok).toBe(false);
    expect(parseDocumentBody({ name: 'a.pdf' }).ok).toBe(true);
    expect(parseDocumentBody({}).ok).toBe(false);
  });
});

describe('parseActor', () => {
  it('decodes the name and validates the role', () => {
    expect(parseActor(encodeURIComponent('Patrícia Nogueira'), 'requester')).toEqual({
      name: 'Patrícia Nogueira',
      role: 'requester',
    });
  });

  it.each([
    [null, 'requester'],
    ['Ana', null],
    ['Ana', 'superuser'],
    ['%E0%A4%A', 'requester'],
    ['', 'requester'],
  ])('rejects %s / %s', (name, role) => {
    expect(parseActor(name, role)).toBeNull();
  });
});
