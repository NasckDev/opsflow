import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marca do OpsFlow: placa de sinalização amarela com três linhas de fila. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
      width: 1.75rem;
      height: 1.75rem;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  template: `
    <svg viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <rect width="28" height="28" rx="6" fill="#ffd21f" />
      <path
        d="M7 9h8M7 14h14M7 19h10"
        stroke="#0d0f12"
        stroke-width="2.6"
        stroke-linecap="round"
        fill="none"
      />
    </svg>
  `,
})
export class Logo {}
