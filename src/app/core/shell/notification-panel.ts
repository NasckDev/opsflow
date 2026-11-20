import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AppNotification, NotificationKind, buildNotifications } from '../../domain/notifications';
import { AppEmpty, AppIcon, AppList, UiIconName } from '../../ui';
import { LocalDatePipe } from '../i18n/format.pipes';
import { TranslatePipe } from '../i18n/translate.pipe';
import { RequestsStore } from '../requests/requests.store';
import { SessionStore } from '../session/session.store';
import { ShellPanels } from './panels';

const ICONS: Readonly<Record<NotificationKind, UiIconName>> = {
  sla_breached: 'exclamation-circle',
  sla_at_risk: 'clock-circle',
  task: 'inbox',
  returned: 'undo',
  approved: 'check-circle',
  rejected: 'close-circle',
};

/** Notificações do papel atual: cada uma leva para a solicitação. */
@Component({
  selector: 'app-notification-panel',
  imports: [TranslatePipe, LocalDatePipe, AppIcon, AppList, AppEmpty],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    a {
      display: grid;
      grid-template-columns: 2rem minmax(0, 1fr);
      gap: 0.75rem;
      padding: 0.75rem;
      color: inherit;
      text-decoration: none;
      border: 1px solid var(--ox-color-border);
      border-radius: 8px;
      background: var(--ox-card);
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
      border-radius: 6px;
    }
    [data-kind='sla_breached'],
    [data-kind='rejected'] {
      --tone: var(--ox-color-danger);
    }
    [data-kind='sla_at_risk'] {
      --tone: var(--ox-color-warning);
    }
    [data-kind='task'] {
      --tone: var(--ox-color-accent-text);
    }
    [data-kind='returned'] {
      --tone: var(--ox-color-violet);
    }
    [data-kind='approved'] {
      --tone: var(--ox-color-success);
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
  `,
  template: `
    @if (items().length === 0) {
      <app-empty [title]="'notifications.empty' | t" />
    } @else {
      <app-list [data]="items()" [ariaLabel]="'notifications.title' | t">
        <ng-template let-item>
          <a
            [attr.href]="'#/requests/' + item.requestId"
            [attr.data-kind]="item.kind"
            (click)="panels.close()"
          >
            <span class="icon"><app-icon [name]="icon(item)" /></span>
            <span class="text">
              <span class="title"
                ><strong class="mono">{{ item.code }}</strong> {{ item.title }}</span
              >
              <small class="muted"
                >{{ 'notifications.kind.' + item.kind | t }} · {{ item.at | localDate }}</small
              >
            </span>
          </a>
        </ng-template>
      </app-list>
    }
  `,
})
export class NotificationPanel {
  protected readonly panels = inject(ShellPanels);
  private readonly store = inject(RequestsStore);
  private readonly session = inject(SessionStore);

  protected readonly items = computed(() =>
    buildNotifications(this.store.requests(), this.session.actor(), new Date()),
  );

  protected icon(item: AppNotification): UiIconName {
    return ICONS[item.kind];
  }
}
