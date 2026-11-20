import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contrastRatio, luminance } from './contrast';

type Mode = 'light' | 'dark';

const root = process.cwd();

function read(relative: string): string {
  return readFileSync(join(root, relative), 'utf8');
}

/** Tokens `--ox-color-*` de cada tema, lidos de src/styles/tokens.scss. */
function tokens(mode: Mode): Record<string, string> {
  const source = read('src/styles/tokens.scss');
  const darkStart = source.indexOf(":root[data-theme='dark']");
  const lightStart = source.indexOf(":root[data-theme='light']");
  const block =
    mode === 'dark'
      ? source.slice(darkStart, source.indexOf('/* Densidade', darkStart))
      : source.slice(lightStart, darkStart);
  const result: Record<string, string> = {};
  for (const match of block.matchAll(/--ox-color-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    result[match[1]] = match[2].toLowerCase();
  }
  return result;
}

/** Variáveis Less de overrides-<modo>.less (a ponte com o tema do NG-ZORRO). */
function lessVariables(mode: Mode): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of read(`src/styles/overrides-${mode}.less`).matchAll(
    /^@([\w-]+):\s*(#[0-9a-fA-F]{6});/gm,
  )) {
    result[match[1]] = match[2].toLowerCase();
  }
  return result;
}

/** Pares texto/fundo (mínimo 4,5:1) e componentes/gráficos (mínimo 3:1). */
const TEXT_PAIRS: readonly (readonly [string, string])[] = [
  ['text', 'bg'],
  ['text', 'surface-raised'],
  ['text-muted', 'bg'],
  ['text-muted', 'surface-raised'],
  ['accent-text', 'surface-raised'],
  ['text-on-accent', 'accent'],
  ['text-on-accent', 'success-solid'],
  ['success', 'success-surface'],
  ['warning', 'warning-surface'],
  ['danger', 'danger-surface'],
  ['info', 'info-surface'],
  ['violet', 'violet-surface'],
  ['accent-text', 'accent-surface'],
];

const GRAPHIC_PAIRS: readonly (readonly [string, string])[] = [
  ['border-strong', 'surface-raised'],
  ['focus-ring', 'surface-raised'],
  ['accent', 'surface-raised'],
  ['cyan', 'surface-raised'],
  ['success', 'surface-raised'],
  ['warning', 'surface-raised'],
  ['danger', 'surface-raised'],
  ['violet', 'surface-raised'],
];

describe('contraste calculado (WCAG 2.2 AA)', () => {
  it('calcula razões conhecidas', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
  });

  for (const mode of ['light', 'dark'] as const) {
    describe(`tema ${mode}`, () => {
      const palette = tokens(mode);

      it.each(TEXT_PAIRS)('texto %s sobre %s tem pelo menos 4,5:1', (foreground, background) => {
        expect(palette[foreground], foreground).toBeDefined();
        expect(palette[background], background).toBeDefined();
        expect(contrastRatio(palette[foreground], palette[background])).toBeGreaterThanOrEqual(4.5);
      });

      it.each(GRAPHIC_PAIRS)('%s sobre %s tem pelo menos 3:1', (foreground, background) => {
        expect(contrastRatio(palette[foreground], palette[background])).toBeGreaterThanOrEqual(3);
      });

      it('mantém o NG-ZORRO alinhado aos tokens do tema', () => {
        const less = lessVariables(mode);
        expect(less['primary-color']).toBe(palette['accent']);
        expect(less['text-color']).toBe(palette['text']);
        expect(less['text-color-secondary']).toBe(palette['text-muted']);
        expect(less['body-background']).toBe(palette['bg']);
        expect(less['component-background']).toBe(palette['surface-raised']);
        expect(less['success-color']).toBe(palette['success']);
        expect(less['warning-color']).toBe(palette['warning']);
        expect(less['error-color']).toBe(palette['danger']);
      });

      it('mantém texto e bordas do NG-ZORRO legíveis', () => {
        const less = lessVariables(mode);
        const background = less['component-background'];
        expect(contrastRatio(less['text-color'], background)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(less['text-color-secondary'], background)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(less['input-placeholder-color'], background)).toBeGreaterThanOrEqual(
          4.5,
        );
        expect(contrastRatio(less['border-color-base'], background)).toBeGreaterThanOrEqual(3);
        expect(contrastRatio(less['disabled-color'], less['input-disabled-bg'])).toBeGreaterThanOrEqual(4.5);
      });
    });
  }

  it('o primário da marca (#2f6bff) não serve de fundo de botão com texto branco', () => {
    // Por isso o botão usa #2a63f0: 4,50 contra branco ficaria abaixo do limite.
    expect(contrastRatio('#ffffff', '#2f6bff')).toBeLessThan(4.5);
    expect(contrastRatio('#ffffff', '#2a63f0')).toBeGreaterThanOrEqual(4.5);
  });
});
