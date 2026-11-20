import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { niceMax, ticks } from './chart-math';

export interface BarSeries {
  readonly label: string;
  /** Variável CSS de cor (ex.: "var(--ox-color-accent)"). */
  readonly color: string;
  readonly values: readonly number[];
}

const DEFAULT_WIDTH = 640;
const MIN_WIDTH = 260;
const HEIGHT = 240;
const PAD = { left: 34, right: 8, top: 10, bottom: 28 } as const;
const GROUP_GAP = 0.34;

interface Bar {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly label: string;
  readonly value: number;
  readonly category: number;
}

/** Barras agrupadas em SVG: eixo, grade, animação de entrada e tooltip por categoria. */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      position: relative;
      display: block;
    }
    svg {
      display: block;
      width: 100%;
      height: 15rem;
      overflow: visible;
    }
    .grid {
      stroke: var(--ox-hairline);
      stroke-width: 1;
    }
    text {
      font-family: var(--ox-font-family-sans);
      font-size: 11px;
      fill: var(--ox-color-text-muted);
    }
    .bar {
      transform-box: fill-box;
      transform-origin: bottom;
      animation: grow 600ms var(--ox-motion-easing-standard) backwards;
      outline: none;
    }
    .bar.dim {
      opacity: 0.45;
    }
    .hit:focus-visible + .band,
    .hit:hover + .band {
      opacity: 1;
    }
    .band {
      fill: var(--ox-hover);
      opacity: 0;
      pointer-events: none;
    }
    .hit {
      fill: transparent;
      outline: none;
    }
    .hit:focus-visible {
      stroke: var(--ox-color-focus-ring);
      stroke-width: 2;
    }
    .tip {
      position: absolute;
      top: 0;
      z-index: 2;
      min-width: 8rem;
      padding: var(--ox-space-2) var(--ox-space-3);
      font-size: var(--ox-font-size-xs);
      color: var(--ox-color-text);
      background: var(--ox-card);
      border: 1px solid var(--ox-color-border);
      border-radius: var(--ox-radius-md);
      box-shadow: var(--ox-shadow-md);
      pointer-events: none;
      transform: translateX(-50%);
    }
    .tip strong {
      display: block;
      margin-bottom: 0.125rem;
    }
    .tip span {
      display: flex;
      align-items: center;
      gap: var(--ox-space-2);
    }
    .tip i {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 2px;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ox-space-4);
      margin-top: var(--ox-space-2);
      font-size: var(--ox-font-size-xs);
      color: var(--ox-color-text-muted);
    }
    .legend span {
      display: inline-flex;
      align-items: center;
      gap: var(--ox-space-2);
    }
    .legend i {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 2px;
    }
    @keyframes grow {
      from {
        transform: scaleY(0);
      }
    }
  `,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height" role="img" [attr.aria-label]="description()">
      @for (tick of yTicks(); track tick.value) {
        <line class="grid" [attr.x1]="pad.left" [attr.x2]="width() - pad.right" [attr.y1]="tick.y" [attr.y2]="tick.y" />
        <text [attr.x]="pad.left - 6" [attr.y]="tick.y + 4" text-anchor="end">{{ tick.value }}</text>
      }
      @for (bar of bars(); track $index) {
        <rect class="bar" [class.dim]="active() !== null && active() !== bar.category" rx="3" [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height" [attr.fill]="bar.color" [style.animation-delay.ms]="bar.category * 45" />
      }
      @for (band of bands(); track band.index) {
        <rect class="hit" tabindex="0" [attr.x]="band.x" [attr.y]="pad.top" [attr.width]="band.width" [attr.height]="height - pad.top - pad.bottom" role="img" [attr.aria-label]="band.label" (mouseenter)="active.set(band.index)" (mouseleave)="active.set(null)" (focus)="active.set(band.index)" (blur)="active.set(null)" />
        <text [attr.x]="band.x + band.width / 2" [attr.y]="height - 8" text-anchor="middle">{{ categories()[band.index] }}</text>
      }
    </svg>
    @if (tip(); as current) {
      <div class="tip" [style.left.%]="current.left">
        <strong>{{ current.title }}</strong>
        @for (row of current.rows; track row.label) {
          <span><i [style.background]="row.color"></i>{{ row.label }}: <b>{{ row.value }}</b></span>
        }
      </div>
    }
    <div class="legend">
      @for (item of series(); track item.label) {
        <span><i [style.background]="item.color"></i>{{ item.label }}</span>
      }
    </div>
  `,
})
export class BarChart {
  readonly categories = input.required<readonly string[]>();
  readonly series = input.required<readonly BarSeries[]>();
  readonly description = input('');

  protected readonly width = signal(DEFAULT_WIDTH);
  protected readonly height = HEIGHT;
  protected readonly pad = PAD;
  protected readonly active = signal<number | null>(null);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      const element = this.host.nativeElement;
      this.width.set(Math.max(MIN_WIDTH, Math.round(element.clientWidth)));
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() =>
        this.width.set(Math.max(MIN_WIDTH, Math.round(element.clientWidth))),
      );
      observer.observe(element);
    });
  }

  private readonly max = computed(() =>
    niceMax(Math.max(0, ...this.series().flatMap((item) => item.values))),
  );
  private readonly plotHeight = HEIGHT - PAD.top - PAD.bottom;
  private readonly slot = computed(
    () => (this.width() - PAD.left - PAD.right) / Math.max(1, this.categories().length),
  );

  protected readonly yTicks = computed(() =>
    ticks(this.max()).map((value) => ({
      value,
      y: PAD.top + this.plotHeight - (value / this.max()) * this.plotHeight,
    })),
  );

  protected readonly bars = computed<Bar[]>(() => {
    const series = this.series();
    const groupWidth = this.slot() * (1 - GROUP_GAP);
    const barWidth = groupWidth / Math.max(1, series.length);
    return this.categories().flatMap((_, category) =>
      series.map((item, index) => {
        const value = item.values[category] ?? 0;
        const height = (value / this.max()) * this.plotHeight;
        return {
          x: PAD.left + this.slot() * category + (this.slot() - groupWidth) / 2 + barWidth * index,
          y: PAD.top + this.plotHeight - height,
          width: Math.max(2, barWidth - 2),
          height,
          color: item.color,
          label: item.label,
          value,
          category,
        };
      }),
    );
  });

  protected readonly bands = computed(() =>
    this.categories().map((name, index) => ({
      index,
      x: PAD.left + this.slot() * index,
      width: this.slot(),
      label: `${name}: ${this.series()
        .map((item) => `${item.label} ${item.values[index] ?? 0}`)
        .join(', ')}`,
    })),
  );

  protected readonly tip = computed(() => {
    const index = this.active();
    if (index === null) return null;
    return {
      left: ((PAD.left + this.slot() * (index + 0.5)) / this.width()) * 100,
      title: this.categories()[index],
      rows: this.series().map((item) => ({
        label: item.label,
        color: item.color,
        value: item.values[index] ?? 0,
      })),
    };
  });
}
