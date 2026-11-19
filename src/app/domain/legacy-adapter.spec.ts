import {
  LegacyAdapterError,
  LegacyRequest,
  adaptLegacyRequest,
  parseLegacyAmount,
  parseLegacyDate,
} from './legacy-adapter';

const legacy = (overrides: Partial<LegacyRequest> = {}): LegacyRequest => ({
  REQ_ID: 42,
  TITULO: '  Renovação de licença ',
  DESCR: 'Licença anual',
  TIPO: 'CONTRATO',
  STATUS_CD: 'REV',
  PRIORIDADE: 1,
  VALOR: '12.345,67',
  SOLICITANTE: 'Ana Souza',
  DT_CRIACAO: '01/11/2026',
  DT_LIMITE: '30/11/2026',
  ANEXOS: 'contrato.pdf; ;proposta.pdf',
  ...overrides,
});

describe('legacy adapter', () => {
  it('maps a legacy record to the new domain', () => {
    const result = adaptLegacyRequest(legacy());
    if (!result.ok) throw new Error(result.error);

    expect(result.value).toMatchObject({
      id: 'legacy-42',
      code: 'LEG-00042',
      title: 'Renovação de licença',
      category: 'contract',
      priority: 'high',
      status: 'in_review',
      amount: 12345.67,
      createdAt: '2026-11-01T00:00:00.000Z',
      dueAt: '2026-11-30T00:00:00.000Z',
      documents: ['contrato.pdf', 'proposta.pdf'],
    });
    expect(result.value.audit).toHaveLength(1);
    expect(result.value.audit[0]).toMatchObject({ action: 'migrate', from: null, to: 'in_review' });
  });

  it('defaults missing optional fields', () => {
    const result = adaptLegacyRequest(legacy({ DESCR: undefined, ANEXOS: undefined }));
    expect(result.ok && result.value.description).toBe('');
    expect(result.ok && result.value.documents).toEqual([]);
  });

  it.each([
    [{ TITULO: '  ' }, 'missing_title'],
    [{ STATUS_CD: 'XYZ' }, 'unknown_status'],
    [{ TIPO: 'OUTRO' }, 'unknown_category'],
    [{ PRIORIDADE: 9 }, 'invalid_priority'],
    [{ VALOR: '12,3' }, 'invalid_amount'],
    [{ DT_CRIACAO: '31/02/2026' }, 'invalid_date'],
    [{ DT_LIMITE: '2026-11-30' }, 'invalid_date'],
  ] as const)('rejects %j with %s', (overrides, error) => {
    expect(adaptLegacyRequest(legacy(overrides))).toEqual({
      ok: false,
      error: error satisfies LegacyAdapterError,
    });
  });

  it.each([
    ['0,99', 0.99],
    ['1.000,00', 1000],
    ['1.234.567,89', 1234567.89],
  ])('parses amount %s', (input, expected) => {
    expect(parseLegacyAmount(input)).toBe(expected);
  });

  it('parses valid dates and rejects malformed ones', () => {
    expect(parseLegacyDate('29/02/2028')).toBe('2028-02-29T00:00:00.000Z');
    expect(parseLegacyDate('29/02/2026')).toBeNull();
    expect(parseLegacyDate('1/1/2026')).toBeNull();
  });
});
