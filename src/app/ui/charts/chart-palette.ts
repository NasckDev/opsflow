export interface ChartPalette {
  readonly text: string;
  readonly muted: string;
  readonly grid: string;
  readonly surface: string;
  readonly fontFamily: string;
  readonly accent: string;
  /** Série neutra (o amarelo fica reservado ao que pede ação: gargalo, em risco). */
  readonly neutral: string;
  readonly cyan: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly violet: string;
  readonly series: readonly string[];
}

function token(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  return styles.getPropertyValue(name).trim() || fallback;
}

/** Lê as cores do tema ativo (tokens CSS), para o ECharts desenhar com a identidade do app. */
export function chartPalette(): ChartPalette {
  const styles = getComputedStyle(document.documentElement);
  const accent = token(styles, '--ox-color-accent', '#ffd21f');
  const neutral = token(styles, '--ox-color-text-soft', '#b4bcc6');
  const cyan = token(styles, '--ox-color-cyan', '#2dd4e0');
  const success = token(styles, '--ox-color-success', '#4fd18b');
  const warning = token(styles, '--ox-color-warning', '#ffd21f');
  const danger = token(styles, '--ox-color-danger', '#ff8a5c');
  const violet = token(styles, '--ox-color-violet', '#b79cff');
  return {
    text: token(styles, '--ox-color-text', '#f2f3f5'),
    muted: token(styles, '--ox-color-text-muted', '#98a1ad'),
    grid: token(styles, '--ox-color-border', '#23272e'),
    surface: token(styles, '--ox-color-surface-raised', '#16191e'),
    fontFamily: token(styles, '--ox-font-family-sans', 'sans-serif'),
    accent,
    neutral,
    cyan,
    success,
    warning,
    danger,
    violet,
    series: [neutral, success, danger, warning, violet, cyan],
  };
}
