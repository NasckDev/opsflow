import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface HBarItem {
  readonly label: string;
  readonly value: number;
  /** Texto do valor já formatado (ex.: "1d 4h"). */
  readonly display: string;
  readonly highlight?: boolean;
}

/** Barras horizontais com valor ao lado: legíveis no celular e sem eixo para decifrar. */
@Component({
  selector: 'app-hbar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    ul {
      display: grid;
      gap: var(--ox-space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: grid;
      grid-template-columns: minmax(5.5rem, 28%) minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--ox-space-3);
    }
    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .track {
      height: 0.625rem;
      background: var(--ox-neutral-surface);
      border-radius: var(--ox-radius-full);
      overflow: hidden;
    }
    .fill {
      display: block;
      height: 100%;
      background: var(--ox-color-accent);
      border-radius: inherit;
      transform-origin: left;
      animation: fill 700ms var(--ox-motion-easing-standard) backwards;
    }
    li[data-highlight='true'] .fill {
      background: var(--ox-color-warning);
    }
    .value {
      min-width: 3.25rem;
      text-align: right;
      font-family: var(--ox-font-family-mono);
      font-size: var(--ox-font-size-xs);
      font-weight: var(--ox-font-weight-medium);
      font-variant-numeric: tabular-nums;
    }
    @keyframes fill {
      from {
        transform: scaleX(0);
      }
    }
  `,
  template: `
    <ul [attr.aria-label]="description()">
      @for (item of items(); track item.label; let i = $index) {
        <li [attr.data-highlight]="item.highlight ? 'true' : null">
          <span class="label">{{ item.label }}</span>
          <span class="track" aria-hidden="true">
            <span class="fill" [style.width.%]="percent(item)" [style.animation-delay.ms]="i * 60"></span>
          </span>
          <span class="value">{{ item.display }}</span>
        </li>
      }
    </ul>
  `,
})
export class HBarChart {
  readonly items = input.required<readonly HBarItem[]>();
  readonly description = input('');
  private readonly max = computed(() => Math.max(1, ...this.items().map((item) => item.value)));

  protected percent(item: HBarItem): number {
    return (item.value / this.max()) * 100;
  }
}
