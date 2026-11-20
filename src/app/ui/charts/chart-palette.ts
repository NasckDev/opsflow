export interface ChartPalette {
  readonly text: string;
  readonly muted: string;
  readonly grid: string;
  readonly surface: string;
  readonly fontFamily: string;
  readonly accent: string;
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
  const accent = token(styles, '--ox-color-accent', '#2a63f0');
  const cyan = token(styles, '--ox-color-cyan', '#0e8f99');
  const success = token(styles, '--ox-color-success', '#047857');
  const warning = token(styles, '--ox-color-warning', '#92400e');
  const danger = token(styles, '--ox-color-danger', '#b42318');
  const violet = token(styles, '--ox-color-violet', '#6d28d9');
  return {
    text: token(styles, '--ox-color-text', '#111418'),
    muted: token(styles, '--ox-color-text-muted', '#4a5565'),
    grid: token(styles, '--ox-color-border', '#d8dde5'),
    surface: token(styles, '--ox-color-surface-raised', '#ffffff'),
    fontFamily: token(styles, '--ox-font-family-sans', 'sans-serif'),
    accent,
    cyan,
    success,
    warning,
    danger,
    violet,
    series: [accent, cyan, success, warning, danger, violet],
  };
}
