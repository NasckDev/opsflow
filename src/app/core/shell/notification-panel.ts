import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNotification, NotificationKind, buildNotifications } from '../../domain/notifications';
import { Icon, IconName } from '../../shared/icon';
import { LocalDatePipe } from '../i18n/format.pipes';
import { TranslatePipe } from '../i18n/translate.pipe';
import { RequestsStore } from '../requests/requests.store';
import { SessionStore } from '../session/session.store';
import { Popover } from './popover';

const ICONS: Readonly<Record<NotificationKind, IconName>> = {
  sla_breached: 'alert',
  sla_at_risk: 'clock',
  task: 'inbox',
  returned: 'undo',
  approved: 'checkCircle',
  rejected: 'xCircle',
};

@Component({
  selector: 'app-notification-panel',
  imports: [CdkTrapFocus, RouterLink, TranslatePipe, LocalDatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    ul {
      display: grid;
      gap: 2px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    a {
      display: grid;
      grid-template-columns: 2rem minmax(0, 1fr);
      gap: var(--ox-space-3);
      padding: var(--ox-space-3);
      color: inherit;
      text-decoration: none;
      border-radius: var(--ox-radius-md);
    }
    a:hover {
      background: var(--ox-hover);
    }
    .icon {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      color: var(--tone);
      background: color-mix(in srgb, var(--tone) 14%, transparent);
      border-radius: var(--ox-radius-md);
    }
    li[data-kind='sla_breached'] {
      --tone: var(--ox-color-danger);
    }
    li[data-kind='sla_at_risk'] {
      --tone: var(--ox-color-warning);
    }
    li[data-kind='task'] {
      --tone: var(--ox-color-accent-text);
    }
    li[data-kind='returned'] {
      --tone: var(--ox-color-violet);
    }
    li[data-kind='approved'] {
      --tone: var(--ox-color-success);
    }
    li[data-kind='rejected'] {
      --tone: var(--ox-color-danger);
    }
    .text {
      display: grid;
      gap: 2px;
      min-width: 0;
      line-height: 1.35;
    }
    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    small {
      color: var(--ox-color-text-muted);
    }
    .empty {
      display: grid;
      justify-items: center;
      gap: var(--ox-space-2);
      padding: var(--ox-space-6) var(--ox-space-3);
      text-align: center;
      color: var(--ox-color-text-muted);
    }
  `,
  template: `
    <div
      class="popover-card"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="'notifications.title' | t"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
    >
      <header>
        <h2>{{ 'notifications.title' | t }}</h2>
        <button type="button" class="btn btn-ghost btn-icon" [attr.aria-label]="'app.close' | t" (click)="close()">
          <app-icon name="x" />
        </button>
      </header>
      @if (items().length === 0) {
        <p class="empty">
          <app-icon name="checkAll" [size]="1.75" />
          {{ 'notifications.empty' | t }}
        </p>
      } @else {
        <ul>
          @for (item of items(); track item.id) {
            <li [attr.data-kind]="item.kind">
              <a [routerLink]="['/requests', item.requestId]" (click)="close(false)">
                <span class="icon"><app-icon [name]="icon(item)" /></span>
                <span class="text">
                  <span class="title"><strong class="mono">{{ item.code }}</strong> {{ item.title }}</span>
                  <small>{{ 'notifications.kind.' + item.kind | t }} · {{ item.at | localDate }}</small>
                </span>
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class NotificationPanel {
  private readonly popover = inject(Popover);
  private readonly store = inject(RequestsStore);
  private readonly session = inject(SessionStore);

  protected readonly items = computed(() =>
    buildNotifications(this.store.requests(), this.session.actor(), new Date()),
  );

  protected icon(item: AppNotification): IconName {
    return ICONS[item.kind];
  }

  protected close(restoreFocus = true): void {
    this.popover.close(restoreFocus);
  }
}
