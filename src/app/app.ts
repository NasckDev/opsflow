import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TranslatePipe } from './core/i18n/translate.pipe';
import { RequestsStore } from './core/requests/requests.store';
import { SearchStore } from './core/search/search.store';
import { SessionStore } from './core/session/session.store';
import { NotificationPanel } from './core/shell/notification-panel';
import { Popover } from './core/shell/popover';
import { ProfilePanel } from './core/shell/profile-panel';
import { Shortcuts } from './core/ui/shortcuts.service';
import { Toasts } from './core/ui/toasts';
import { inboxTasks } from './domain/inbox';
import { buildNotifications } from './domain/notifications';
import { Avatar } from './shared/avatar';
import { Icon } from './shared/icon';
import { Logo } from './shared/logo';

export type Section = 'inbox' | 'requests' | 'new' | 'board' | 'analytics' | 'admin' | 'other';

export function sectionOf(url: string): Section {
  if (url.startsWith('/requests/new')) return 'new';
  if (url.startsWith('/requests')) return 'requests';
  const first = url.split('/')[1];
  return first === 'inbox' || first === 'board' || first === 'analytics' || first === 'admin'
    ? first
    : 'other';
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, TranslatePipe, Icon, Logo, Avatar, Toasts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly store = inject(RequestsStore);
  private readonly shortcuts = inject(Shortcuts);
  protected readonly session = inject(SessionStore);
  protected readonly search = inject(SearchStore);
  protected readonly popover = inject(Popover);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  protected readonly section = computed(() => sectionOf(this.url()));

  protected readonly inboxCount = computed(
    () => inboxTasks(this.store.requests(), this.session.actor(), new Date()).length,
  );

  protected readonly notificationCount = computed(
    () => buildNotifications(this.store.requests(), this.session.actor(), new Date()).length,
  );

  constructor() {
    this.store.load();
    this.shortcuts.start();
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    if (this.url() !== '/requests') void this.router.navigateByUrl('/requests');
  }

  protected clearSearch(): void {
    this.search.clear();
  }

  protected toggleProfile(event: Event): void {
    this.popover.toggle(event.currentTarget as HTMLElement, 'profile', ProfilePanel);
  }

  protected toggleNotifications(event: Event): void {
    this.popover.toggle(event.currentTarget as HTMLElement, 'notifications', NotificationPanel);
  }

  protected openPalette(): void {
    this.shortcuts.openPalette();
  }

  protected focusMain(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }
}
