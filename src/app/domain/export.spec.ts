import { csvCell, requestsToCsv } from './export';
import { buildRequest } from './testing/request-fixture';

describe('csvCell', () => {
  it('quotes cells with separators, quotes and line breaks', () => {
    expect(csvCell('a;b')).toBe('"a;b"');
    expect(csvCell('diz "oi"')).toBe('"diz ""oi"""');
    expect(csvCell('linha1\nlinha2')).toBe('"linha1\nlinha2"');
  });

  it.each(['=SOMA(A1)', '+1', '-2', '@cmd'])('neutralizes formula injection in %s', (value) => {
    expect(csvCell(value).startsWith("'")).toBe(true);
  });

  it('keeps numbers untouched', () => {
    expect(csvCell(-5)).toBe('-5');
  });
});

describe('requestsToCsv', () => {
  const labels = {
    headers: ['Código', 'Título'],
    status: (value: string) => value.toUpperCase(),
    priority: (value: string) => value,
    category: (value: string) => value,
  };

  it('writes header and one row per request with decimal comma', () => {
    const csv = requestsToCsv([buildRequest({ amount: 1234.5, title: 'Compra; urgente' })], labels);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('Código;Título');
    expect(row).toContain('"Compra; urgente"');
    expect(row).toContain('1234,50');
    expect(row).toContain('DRAFT');
  });
});
