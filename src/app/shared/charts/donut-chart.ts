import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { arcs, donutPath } from './chart-math';

export interface DonutSegment {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

const SIZE = 180;
const CENTER = SIZE / 2;
const OUTER = 82;
const INNER = 56;

/** Rosca com valor central, legenda com contagens e destaque da fatia em foco. */
@Component({
  selector: 'app-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      grid-template-columns: minmax(0, 11rem) minmax(0, 1fr);
      align-items: center;
      gap: var(--ox-space-5);
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
    }
    path {
      transform-origin: center;
      transform-box: fill-box;
      animation: sweep 700ms var(--ox-motion-easing-standard) backwards;
      transition: opacity var(--ox-motion-duration-fast) var(--ox-motion-easing-standard);
      outline: none;
    }
    path.dim {
      opacity: 0.35;
    }
    path:focus-visible {
      stroke: var(--ox-color-focus-ring);
      stroke-width: 2;
    }
    .center-value {
      font-family: var(--ox-font-family-sans);
      font-size: 28px;
      font-weight: 600;
      fill: var(--ox-color-text);
    }
    .center-label {
      font-family: var(--ox-font-family-sans);
      font-size: 10px;
      fill: var(--ox-color-text-muted);
    }
    ul {
      display: grid;
      gap: var(--ox-space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      align-items: center;
      gap: var(--ox-space-2);
      font-size: var(--ox-font-size-sm);
      padding: 0.125rem 0.25rem;
      border-radius: var(--ox-radius-sm);
    }
    li.active {
      background: var(--ox-hover);
    }
    i {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 2px;
      flex: none;
    }
    .num {
      margin-left: auto;
      font-family: var(--ox-font-family-mono);
      font-variant-numeric: tabular-nums;
    }
    @keyframes sweep {
      from {
        opacity: 0;
        transform: rotate(-40deg) scale(0.92);
      }
    }
    @media (max-width: 479px) {
      :host {
        grid-template-columns: 1fr;
        justify-items: center;
      }
      svg {
        max-width: 11rem;
      }
      ul {
        width: 100%;
      }
    }
  `,
  template: `
    <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" role="img" [attr.aria-label]="description()">
      @for (slice of slices(); track slice.label) {
        <path
          [attr.d]="slice.path"
          [attr.fill]="slice.color"
          [class.dim]="active() !== null && active() !== slice.label"
          tabindex="0"
          role="img"
          [attr.aria-label]="slice.label + ': ' + slice.value"
          (mouseenter)="active.set(slice.label)"
          (mouseleave)="active.set(null)"
          (focus)="active.set(slice.label)"
          (blur)="active.set(null)"
        />
      }
      <text class="center-value" [attr.x]="center" [attr.y]="center + 4" text-anchor="middle">{{ centerValue() }}</text>
      <text class="center-label" [attr.x]="center" [attr.y]="center + 20" text-anchor="middle">{{ centerLabel() }}</text>
    </svg>
    <ul>
      @for (slice of slices(); track slice.label) {
        <li [class.active]="active() === slice.label" (mouseenter)="active.set(slice.label)" (mouseleave)="active.set(null)">
          <i [style.background]="slice.color"></i>{{ slice.label }}
          <span class="num">{{ slice.value }}</span>
        </li>
      }
    </ul>
  `,
})
export class DonutChart {
  readonly segments = input.required<readonly DonutSegment[]>();
  readonly centerValue = input('');
  readonly centerLabel = input('');
  readonly description = input('');

  protected readonly size = SIZE;
  protected readonly center = CENTER;
  protected readonly active = signal<string | null>(null);

  protected readonly slices = computed(() => {
    const segments = this.segments();
    const shapes = arcs(segments.map((segment) => segment.value));
    return segments.map((segment, index) => ({
      ...segment,
      path: donutPath(CENTER, CENTER, OUTER, INNER, shapes[index]),
    }));
  });
}
