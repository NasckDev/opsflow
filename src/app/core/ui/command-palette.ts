import { CdkTrapFocus } from '@angular/cdk/a11y';
import { DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ROLES, Role } from '../../domain/request.model';
import { Icon, IconName } from '../../shared/icon';
import { TranslatePipe } from '../i18n/translate.pipe';
import { TranslationService } from '../i18n/translation.service';
import { RequestsStore } from '../requests/requests.store';
import { SessionStore } from '../session/session.store';
import { ThemeService } from '../theme/theme.service';

export interface PaletteCommand {
  readonly id: string;
  readonly group: 'go' | 'action' | 'request';
  readonly label: string;
  readonly hint?: string;
  readonly icon: IconName;
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
  imports: [CdkTrapFocus, TranslatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
})
export class CommandPalette {
  private readonly ref = inject<DialogRef<void>>(DialogRef);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);
  private readonly session = inject(SessionStore);
  private readonly theme = inject(ThemeService);
  private readonly store = inject(RequestsStore);
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('field');

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
        icon: 'list',
        run: go('/requests'),
      },
      { id: 'go-board', group: 'go', label: t('app.nav.board'), icon: 'board', run: go('/board') },
      { id: 'go-admin', group: 'go', label: t('app.nav.admin'), icon: 'shield', run: go('/admin') },
      {
        id: 'go-new',
        group: 'go',
        label: t('app.nav.new'),
        icon: 'plusCircle',
        run: go('/requests/new'),
      },
    ];
    if (this.session.can('audit.view')) {
      navigation.splice(3, 0, {
        id: 'go-analytics',
        group: 'go',
        label: t('app.nav.analytics'),
        icon: 'chart',
        run: go('/analytics'),
      });
    }
    const actions: PaletteCommand[] = [
      {
        id: 'theme',
        group: 'action',
        label: t('palette.toggleTheme'),
        icon: this.theme.theme() === 'dark' ? 'sun' : 'moon',
        run: () => this.theme.toggle(),
      },
      {
        id: 'locale',
        group: 'action',
        label: t('palette.toggleLocale'),
        icon: 'user',
        run: () => this.i18n.setLocale(this.i18n.locale() === 'en' ? 'pt-BR' : 'en'),
      },
      {
        id: 'density',
        group: 'action',
        label: t('palette.toggleDensity'),
        icon: 'list',
        run: () =>
          this.theme.setDensity(this.theme.density() === 'compact' ? 'comfortable' : 'compact'),
      },
      ...ROLES.map<PaletteCommand>((role) => ({
        id: `role-${role}`,
        group: 'action',
        label: `${t('palette.actAs')} ${t(`role.${role}`)}`,
        icon: 'users',
        run: () => this.session.setRole(role as Role),
      })),
    ];
    const requests = this.store.requests().map<PaletteCommand>((request) => ({
      id: `req-${request.id}`,
      group: 'request',
      label: request.title,
      hint: request.code,
      icon: 'file',
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
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
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
    this.ref.close();
    command.run();
  }

  protected focusInput(): void {
    this.input().nativeElement.focus();
  }
}
