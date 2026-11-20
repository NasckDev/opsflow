import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

const DURATION_MS = 700;

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Número que sobe até o valor (KPIs). Sem animação com prefers-reduced-motion. */
@Component({
  selector: 'app-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span aria-hidden="true">{{ shown() }}</span
    ><span class="visually-hidden">{{ finalText() }}</span>`,
})
export class Counter {
  readonly value = input.required<number>();
  readonly suffix = input('');
  protected readonly shown = signal('0');
  protected readonly finalText = signal('0');
  private frame = 0;

  constructor() {
    effect((onCleanup) => {
      const target = this.value();
      const suffix = this.suffix();
      this.finalText.set(`${target}${suffix}`);
      if (prefersReducedMotion() || target === 0) {
        this.shown.set(`${target}${suffix}`);
        return;
      }
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / DURATION_MS);
        const eased = 1 - (1 - progress) ** 3;
        this.shown.set(`${Math.round(target * eased)}${suffix}`);
        if (progress < 1) this.frame = requestAnimationFrame(step);
      };
      this.frame = requestAnimationFrame(step);
      onCleanup(() => cancelAnimationFrame(this.frame));
    });
  }
}
