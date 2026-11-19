import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marca do OpsFlow: dois fluxos convergindo em um nó de decisão. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
      width: 2rem;
      height: 2rem;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
    }
    .bg {
      fill: var(--nui-color-accent);
    }
    .fg {
      stroke: var(--nui-color-text-on-accent);
    }
    .dot {
      fill: var(--nui-color-text-on-accent);
    }
  `,
  template: `
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect class="bg" width="32" height="32" rx="9" />
      <path
        class="fg"
        d="M9.5 10.5H14c4 0 4 5.5 9 5.5M9.5 21.5H14c4 0 4-5.5 9-5.5"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
      />
      <circle class="dot" cx="9.5" cy="10.5" r="2.2" />
      <circle class="dot" cx="9.5" cy="21.5" r="2.2" />
      <circle class="dot" cx="23" cy="16" r="3" />
    </svg>
  `,
})
export class Logo {}
