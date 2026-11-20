import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '../i18n/translate.pipe';
import { Icon, IconName } from '../../shared/icon';
import { Toast, ToastKind, ToastService } from './toast.service';

const ICONS: Readonly<Record<ToastKind, IconName>> = {
  success: 'checkCircle',
  error: 'alert',
  info: 'info',
};

@Component({
  selector: 'app-toasts',
  imports: [Icon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    [role='status'] {
      display: grid;
      gap: var(--ox-space-2);
    }
    :host {
      position: fixed;
      right: var(--ox-space-4);
      bottom: var(--ox-space-4);
      z-index: var(--ox-z-index-toast);
      display: grid;
      gap: var(--ox-space-2);
      width: min(24rem, calc(100vw - 2rem));
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--ox-space-3);
      padding: var(--ox-space-3) var(--ox-space-4);
      color: var(--ox-color-text);
      background: var(--ox-color-surface-raised);
      border: 1px solid var(--ox-color-border);
      border-left: 4px solid var(--tone);
      border-radius: var(--ox-radius-md);
      box-shadow: var(--ox-shadow-lg);
      pointer-events: auto;
      animation: toast-in var(--ox-motion-duration-normal) var(--ox-motion-easing-standard);
    }
    .toast[data-kind='success'] {
      --tone: var(--ox-color-success);
    }
    .toast[data-kind='error'] {
      --tone: var(--ox-color-danger);
    }
    .toast[data-kind='info'] {
      --tone: var(--ox-color-accent);
    }
    .toast app-icon {
      color: var(--tone);
      margin-top: 1px;
    }
    .message {
      flex: 1;
      line-height: 1.4;
    }
    button {
      display: grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      margin: -0.25rem -0.5rem -0.25rem 0;
      color: var(--ox-color-text-muted);
      background: transparent;
      border: 0;
      border-radius: var(--ox-radius-sm);
      cursor: pointer;
    }
    button:hover {
      background: var(--ox-hover);
    }
    .action {
      width: auto;
      height: auto;
      min-height: 2rem;
      margin: -0.25rem 0;
      padding: 0 var(--ox-space-3);
      font-weight: var(--ox-font-weight-semibold);
      color: var(--ox-color-accent-text);
      border: 1px solid var(--ox-color-border);
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(16px);
      }
    }
    @media (max-width: 959px) {
      :host {
        left: 0;
        right: 0;
        margin: 0 auto;
        bottom: calc(var(--ox-bottomnav-h) + var(--ox-safe-bottom) + var(--ox-space-3));
      }
    }
  `,
  template: `
    <div aria-live="polite" role="status">
      @for (toast of service.toasts(); track toast.id) {
        <div class="toast" [attr.data-kind]="toast.kind">
          <app-icon [name]="icon(toast)" />
          <span class="message">{{ toast.message }}</span>
          @if (toast.action; as action) {
            <button type="button" class="action" (click)="run(toast, action.run)">{{ action.label }}</button>
          }
          <button
            type="button"
            [attr.aria-label]="'app.close' | t"
            (click)="service.dismiss(toast.id)"
          >
            <app-icon name="x" [size]="0.875" />
          </button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  protected readonly service = inject(ToastService);

  protected run(toast: Toast, run: () => void): void {
    this.service.dismiss(toast.id);
    run();
  }

  protected icon(toast: Toast): IconName {
    return ICONS[toast.kind];
  }
}
