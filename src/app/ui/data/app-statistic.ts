import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzStatisticComponent } from 'ng-zorro-antd/statistic';
import { UiIconName } from '../icons';

export type AppStatisticTone = 'default' | 'success' | 'danger' | 'warning';

const DURATION_MS = 700;

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Indicador (KPI). Números sobem até o valor, exceto com `prefers-reduced-motion`. */
@Component({
  selector: 'app-statistic',
  imports: [NzStatisticComponent, NzIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-tone]': 'tone()' },
  template: `
    <nz-statistic
      [nzTitle]="title()"
      [nzValue]="shown()"
      [nzSuffix]="suffix() || undefined"
      [nzPrefix]="icon() ? iconTpl : undefined"
      [nzLoading]="loading()"
    ></nz-statistic>
    <ng-template #iconTpl><span nz-icon [nzType]="icon()!" aria-hidden="true"></span></ng-template>
    <span class="visually-hidden">{{ title() }}: {{ finalText() }}</span>
  `,
  styles: `
    :host {
      display: block;
    }
    :host([data-tone='success']) {
      --tone: var(--ox-color-success);
    }
    :host([data-tone='danger']) {
      --tone: var(--ox-color-danger);
    }
    :host([data-tone='warning']) {
      --tone: var(--ox-color-warning);
    }
  `,
})
export class AppStatistic {
  readonly title = input.required<string>();
  readonly value = input<number | string | null>(0);
  readonly suffix = input('');
  readonly icon = input<UiIconName | null>(null);
  readonly tone = input<AppStatisticTone>('default');
  readonly loading = input(false);
  readonly animated = input(true);

  protected readonly shown = signal<number | string>(0);
  protected readonly finalText = signal('');
  private frame = 0;

  constructor() {
    effect((onCleanup) => {
      const target = this.value();
      this.finalText.set(`${target ?? '—'}${this.suffix()}`);
      if (
        typeof target !== 'number' ||
        !this.animated() ||
        prefersReducedMotion() ||
        target === 0
      ) {
        this.shown.set(target ?? '—');
        return;
      }
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / DURATION_MS);
        this.shown.set(Math.round(target * (1 - (1 - progress) ** 3)));
        if (progress < 1) this.frame = requestAnimationFrame(step);
      };
      this.frame = requestAnimationFrame(step);
      onCleanup(() => cancelAnimationFrame(this.frame));
    });
  }
}
