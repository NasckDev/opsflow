import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TranslatePipe } from './core/i18n/translate.pipe';
import { TranslationService } from './core/i18n/translation.service';
import { RequestsStore } from './core/requests/requests.store';
import { SearchStore } from './core/search/search.store';
import { SessionStore } from './core/session/session.store';
import { MorePanel } from './core/shell/more-panel';
import { NotificationPanel } from './core/shell/notification-panel';
import { ShellPanels } from './core/shell/panels';
import { ProfilePanel } from './core/shell/profile-panel';
import { CommentPromptHost } from './core/ui/comment-prompt';
import { CommandPalette } from './core/ui/command-palette';
import { ShortcutsDialog } from './core/ui/shortcuts-dialog';
import { Shortcuts } from './core/ui/shortcuts.service';
import { ViewportService } from './core/ui/viewport.service';
import { inboxTasks, todoTasks } from './domain/inbox';
import { buildNotifications } from './domain/notifications';
import { Logo } from './shared/logo';
import {
  AppAvatar,
  AppBadge,
  AppBottomNav,
  AppBottomNavItem,
  AppButton,
  AppDrawer,
  AppIconButton,
  AppInput,
  AppLayout,
  AppMenu,
  AppMenuGroup,
  UiFeedbackHost,
} from './ui';

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
  imports: [
    FormsModule,
    RouterOutlet,
    TranslatePipe,
    Logo,
    AppLayout,
    AppMenu,
    AppButton,
    AppIconButton,
    AppInput,
    AppAvatar,
    AppBadge,
    AppDrawer,
    AppBottomNav,
    UiFeedbackHost,
    CommentPromptHost,
    CommandPalette,
    ShortcutsDialog,
    NotificationPanel,
    ProfilePanel,
    MorePanel,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly store = inject(RequestsStore);
  private readonly shortcuts = inject(Shortcuts);
  private readonly i18n = inject(TranslationService);
  protected readonly session = inject(SessionStore);
  protected readonly search = inject(SearchStore);
  protected readonly panels = inject(ShellPanels);
  protected readonly viewport = inject(ViewportService);

  protected readonly collapsed = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  protected readonly section = computed(() => sectionOf(this.url()));

  /** Pendências de decisão ou envio: cai na hora quando uma decisão é aplicada. */
  protected readonly inboxCount = computed(
    () => todoTasks(inboxTasks(this.store.requests(), this.session.actor(), new Date())).length,
  );

  protected readonly notificationCount = computed(
    () => buildNotifications(this.store.requests(), this.session.actor(), new Date()).length,
  );

  /** Solicitante troca "Quadro" por "Nova" na barra inferior: é o que ele mais faz. */
  protected readonly requesterTab = computed(
    () => this.session.currentRole() === 'requester' && this.session.can('request.create'),
  );

  protected readonly menu = computed<AppMenuGroup[]>(() => {
    this.i18n.locale();
    const t = (key: string) => this.i18n.translateDynamic(key);
    const workspace = [
      {
        key: 'inbox',
        label: t('app.nav.inbox'),
        icon: 'inbox',
        href: '#/inbox',
        badge: this.inboxCount(),
      },
      { key: 'requests', label: t('app.nav.requests'), icon: 'unordered-list', href: '#/requests' },
      { key: 'board', label: t('app.nav.board'), icon: 'project', href: '#/board' },
    ];
    if (this.session.can('audit.view')) {
      workspace.push({
        key: 'analytics',
        label: t('app.nav.analytics'),
        icon: 'bar-chart',
        href: '#/analytics',
      });
    }
    return [
      { title: t('app.nav.workspace'), items: workspace },
      {
        title: t('app.nav.manage'),
        items: [{ key: 'admin', label: t('app.nav.admin'), icon: 'safety', href: '#/admin' }],
      },
    ];
  });

  protected readonly bottomItems = computed<AppBottomNavItem[]>(() => {
    this.i18n.locale();
    const t = (key: string) => this.i18n.translateDynamic(key);
    return [
      {
        key: 'inbox',
        label: t('app.nav.inboxShort'),
        icon: 'inbox',
        href: '#/inbox',
        badge: this.inboxCount(),
      },
      this.requesterTab()
        ? { key: 'new', label: t('app.nav.newShort'), icon: 'plus-circle', href: '#/requests/new' }
        : { key: 'board', label: t('app.nav.board'), icon: 'project', href: '#/board' },
      {
        key: 'requests',
        label: t('app.nav.requestsShort'),
        icon: 'unordered-list',
        href: '#/requests',
      },
      { key: 'more', label: t('app.nav.moreShort'), icon: 'ellipsis' },
    ];
  });

  protected readonly bottomActive = computed(() => {
    const open = this.panels.openKey();
    if (open === 'more' || open === 'profile') return 'more';
    const section = this.section();
    if (section === 'analytics' || section === 'admin') return 'more';
    if (section === 'new') return this.requesterTab() ? 'new' : 'more';
    if (section === 'board') return this.requesterTab() ? 'more' : 'board';
    return section;
  });

  protected readonly drawerWidth = computed(() => (this.viewport.mobile() ? '100%' : 400));

  constructor() {
    this.store.load();
    this.shortcuts.start();
  }

  protected onSearch(value: string | number | null): void {
    this.search.set(String(value ?? ''));
    if (this.url() !== '/requests') void this.router.navigateByUrl('/requests');
  }

  protected goNew(): void {
    void this.router.navigateByUrl('/requests/new');
  }

  protected openPalette(): void {
    this.shortcuts.openPalette();
  }

  protected onBottom(key: string): void {
    if (key === 'more') this.panels.toggle('more');
  }

  protected toggleSider(): void {
    if (this.viewport.mobile()) this.panels.toggle('menu');
    else this.collapsed.update((value) => !value);
  }

  protected focusMain(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }
}
