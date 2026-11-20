import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ROLES, Role } from '../../domain/request.model';
import { AppIcon, AppInput, AppModal, UiIconName } from '../../ui';
import { TranslatePipe } from '../i18n/translate.pipe';
import { TranslationService } from '../i18n/translation.service';
import { RequestsStore } from '../requests/requests.store';
import { SessionStore } from '../session/session.store';
import { UiTheme } from '../../ui';
import { Shortcuts } from './shortcuts.service';

export interface PaletteCommand {
  readonly id: string;
  readonly group: 'go' | 'action' | 'request';
  readonly label: string;
  readonly hint?: string;
  readonly icon: UiIconName;
  readonly run: () => void;
}

const MAX_RESULTS = 12;
const MAX_REQUEST_RESULTS = 6;

/** Texto sem acentos e em minúsculas, para busca tolerante. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function filterCommands(
  commands: readonly PaletteCommand[],
  query: string,
): PaletteCommand[] {
  const needle = normalize(query.trim());
  if (!needle) return commands.filter((command) => command.group !== 'request');
  return commands.filter((command) =>
    normalize(`${command.label} ${command.hint ?? ''}`).includes(needle),
  );
}

@Component({
  selector: 'app-command-palette',
  imports: [FormsModule, TranslatePipe, AppIcon, AppInput, AppModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
})
export class CommandPalette {
  protected readonly shortcuts = inject(Shortcuts);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);
  private readonly session = inject(SessionStore);
  private readonly theme = inject(UiTheme);
  private readonly store = inject(RequestsStore);

  protected readonly query = signal('');
  protected readonly active = signal(0);

  private readonly commands = computed<PaletteCommand[]>(() => {
    this.i18n.locale();
    const t = (key: string) => this.i18n.translateDynamic(key);
    const go = (path: string) => () => void this.router.navigateByUrl(path);
    const navigation: PaletteCommand[] = [
      { id: 'go-inbox', group: 'go', label: t('app.nav.inbox'), icon: 'inbox', run: go('/inbox') },
      {
        id: 'go-list',
        group: 'go',
        label: t('app.nav.requests'),
        icon: 'unordered-list',
        run: go('/requests'),
      },
      { id: 'go-board', group: 'go', label: t('app.nav.board'), icon: 'project', run: go('/board') },
      { id: 'go-admin', group: 'go', label: t('app.nav.admin'), icon: 'safety', run: go('/admin') },
      {
        id: 'go-new',
        group: 'go',
        label: t('app.nav.new'),
        icon: 'plus-circle',
        run: go('/requests/new'),
      },
    ];
    if (this.session.can('audit.view')) {
      navigation.splice(3, 0, {
        id: 'go-analytics',
        group: 'go',
        label: t('app.nav.analytics'),
        icon: 'bar-chart',
        run: go('/analytics'),
      });
    }
    const actions: PaletteCommand[] = [
      {
        id: 'theme',
        group: 'action',
        label: t('palette.toggleTheme'),
        icon: this.theme.mode() === 'dark' ? 'bulb' : 'bulb',
        run: () => this.theme.toggle(),
      },
      {
        id: 'locale',
        group: 'action',
        label: t('palette.toggleLocale'),
        icon: 'global',
        run: () => this.i18n.setLocale(this.i18n.locale() === 'en' ? 'pt-BR' : 'en'),
      },
      {
        id: 'density',
        group: 'action',
        label: t('palette.toggleDensity'),
        icon: 'unordered-list',
        run: () =>
          this.theme.setDensity(this.theme.density() === 'compact' ? 'comfortable' : 'compact'),
      },
      ...ROLES.map<PaletteCommand>((role) => ({
        id: `role-${role}`,
        group: 'action',
        label: `${t('palette.actAs')} ${t(`role.${role}`)}`,
        icon: 'team',
        run: () => this.session.setRole(role as Role),
      })),
    ];
    const requests = this.store.requests().map<PaletteCommand>((request) => ({
      id: `req-${request.id}`,
      group: 'request',
      label: request.title,
      hint: request.code,
      icon: 'file-text',
      run: go(`/requests/${request.id}`),
    }));
    return [...navigation, ...actions, ...requests];
  });

  protected readonly results = computed(() => {
    const matches = filterCommands(this.commands(), this.query());
    const requests = matches
      .filter((item) => item.group === 'request')
      .slice(0, MAX_REQUEST_RESULTS);
    const others = matches.filter((item) => item.group !== 'request');
    return [...others, ...requests].slice(0, MAX_RESULTS);
  });

  constructor() {
    this.store.load();
    // Foco no campo de busca ao abrir (depois da animação do modal).
    effect(() => {
      if (this.shortcuts.paletteOpen()) {
        setTimeout(() => document.getElementById('palette-field')?.focus(), 150);
      }
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const total = this.results().length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (total === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.active.update((index) => (index + step + total) % total);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.execute(this.results()[this.active()]);
    }
  }

  protected execute(command: PaletteCommand | undefined): void {
    if (!command) return;
    this.close();
    command.run();
  }

  protected close(): void {
    this.shortcuts.paletteOpen.set(false);
    this.query.set('');
    this.active.set(0);
  }

  protected onQuery(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }
}
