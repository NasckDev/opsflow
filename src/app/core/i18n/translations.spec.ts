import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DICTIONARIES } from './translations';
import { interpolate } from './translation.service';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(html|ts)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

describe('dictionaries', () => {
  const pt = Object.keys(DICTIONARIES['pt-BR']).sort();
  const en = Object.keys(DICTIONARIES.en).sort();

  it('have the same keys in both languages', () => {
    expect(en).toEqual(pt);
  });

  it('never leave a value empty', () => {
    for (const locale of ['pt-BR', 'en'] as const) {
      const blanks = Object.entries(DICTIONARIES[locale]).filter(([, value]) => !value.trim());
      expect(blanks).toEqual([]);
    }
  });

  it('define every literal key used in templates and code', () => {
    const known = new Set(pt);
    const root = join(process.cwd(), 'src', 'app');
    const used = new Set<string>();
    const pipe = /'([a-z][\w]*(?:\.[\w]+)+)'\s*\|\s*t\b/g;
    const call = /translate(?:Dynamic)?\(\s*'([a-z][\w]*(?:\.[\w]+)+)'/g;
    for (const file of sourceFiles(root)) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of [pipe, call]) {
        for (const match of text.matchAll(pattern)) used.add(match[1]);
      }
    }
    const missing = [...used].filter((key) => !known.has(key)).sort();
    expect(missing).toEqual([]);
  }, 60_000);
});

describe('interpolate', () => {
  const template = '{count, plural, one {# tarefa} other {# tarefas}} em {role}';

  it('uses the singular form for one', () => {
    expect(interpolate(template, { count: 1, role: 'Aprovador' })).toBe('1 tarefa em Aprovador');
  });

  it('uses the plural form for zero and many', () => {
    expect(interpolate(template, { count: 5, role: 'X' })).toBe('5 tarefas em X');
    expect(interpolate(template, { count: 0, role: 'X' })).toBe('0 tarefas em X');
  });

  it('keeps unknown placeholders untouched', () => {
    expect(interpolate('Olá {name}', {})).toBe('Olá {name}');
  });

  it('follows English plural rules', () => {
    const english = '{count, plural, one {# request} other {# requests}}';
    expect(interpolate(english, { count: 0 })).toBe('0 requests');
    expect(interpolate(english, { count: 1 })).toBe('1 request');
  });
});
