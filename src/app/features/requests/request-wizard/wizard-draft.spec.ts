import { WIZARD_DRAFT_VERSION, draftKeyFor, isWorthSaving, parseWizardDraft } from './wizard-draft';

const value = {
  title: 'Notebooks',
  description: '',
  category: 'purchase',
  priority: 'medium',
  amount: 100,
  dueAt: '2027-01-20T10:00',
  documents: '',
};

const stored = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    version: WIZARD_DRAFT_VERSION,
    savedAt: '2026-11-19T12:00:00.000Z',
    step: 1,
    value,
    ...overrides,
  });

describe('parseWizardDraft', () => {
  it('reads a well-formed draft', () => {
    expect(parseWizardDraft(stored())).toMatchObject({ step: 1, value: { title: 'Notebooks' } });
  });

  it.each([
    ['null storage', null],
    ['empty string', ''],
    ['broken JSON', '{nope'],
    ['a JSON array', '[]'],
    ['a JSON number', '7'],
  ])('returns null for %s', (_label, raw) => {
    expect(parseWizardDraft(raw)).toBeNull();
  });

  it('drops drafts of another version', () => {
    expect(parseWizardDraft(stored({ version: 0 }))).toBeNull();
  });

  it('drops wrong types', () => {
    expect(parseWizardDraft(stored({ value: { ...value, title: 5 } }))).toBeNull();
    expect(parseWizardDraft(stored({ value: { ...value, category: 'food' } }))).toBeNull();
    expect(parseWizardDraft(stored({ value: { ...value, amount: '10' } }))).toBeNull();
    expect(parseWizardDraft(stored({ savedAt: 'ontem' }))).toBeNull();
    expect(parseWizardDraft(stored({ step: 'um' }))).toBeNull();
  });

  it('rejects invalid amounts', () => {
    expect(parseWizardDraft(stored({ value: { ...value, amount: -1 } }))).toBeNull();
    expect(
      parseWizardDraft(stored({ value: { ...value, amount: null } }))?.value.amount,
    ).toBeNull();
  });

  it('clamps the step to the first two', () => {
    expect(parseWizardDraft(stored({ step: 9 }))?.step).toBe(1);
    expect(parseWizardDraft(stored({ step: -4 }))?.step).toBe(0);
  });

  it('truncates absurdly long text', () => {
    const draft = parseWizardDraft(stored({ value: { ...value, title: 'x'.repeat(5000) } }));
    expect(draft?.value.title).toHaveLength(200);
  });
});

describe('isWorthSaving and draftKeyFor', () => {
  const base = { ...parseWizardDraft(stored())!.value, title: '', amount: null };

  it('ignores an untouched form and keeps anything the user typed', () => {
    expect(isWorthSaving(base)).toBe(false);
    expect(isWorthSaving({ ...base, title: 'a' })).toBe(true);
    expect(isWorthSaving({ ...base, amount: 5 })).toBe(true);
  });

  it('separates drafts per user', () => {
    expect(draftKeyFor('Ana')).not.toBe(draftKeyFor('Bruno'));
  });
});
