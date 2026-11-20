/** Teto "bonito" para o eixo: 1, 2, 5 vezes uma potência de dez. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const fraction = value / base;
  const rounded = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return rounded * base;
}

/** Marcas do eixo Y: de 0 até o teto, em `count` passos. */
export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, index) => (max / count) * index);
}

export interface ArcSegment {
  readonly start: number;
  readonly end: number;
}

/** Fatias de rosca em radianos (0 = topo), proporcionais aos valores. */
export function arcs(values: readonly number[]): ArcSegment[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return values.map(() => ({ start: 0, end: 0 }));
  let cursor = 0;
  return values.map((value) => {
    const start = cursor;
    cursor += (value / total) * Math.PI * 2;
    return { start, end: cursor };
  });
}

/** Caminho SVG de um arco de rosca entre dois ângulos. */
export function donutPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  segment: ArcSegment,
): string {
  const sweep = segment.end - segment.start;
  if (sweep <= 0) return '';
  const full = sweep >= Math.PI * 2 - 0.0001;
  const end = full ? segment.start + Math.PI * 2 - 0.0001 : segment.end;
  const point = (radius: number, angle: number) =>
    `${(cx + radius * Math.sin(angle)).toFixed(2)} ${(cy - radius * Math.cos(angle)).toFixed(2)}`;
  const large = end - segment.start > Math.PI ? 1 : 0;
  return [
    `M ${point(outer, segment.start)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${point(outer, end)}`,
    `L ${point(inner, end)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${point(inner, segment.start)}`,
    'Z',
  ].join(' ');
}
