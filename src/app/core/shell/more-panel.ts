import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AppAvatar, AppIcon, UiIconName } from '../../ui';
import { TranslatePipe } from '../i18n/translate.pipe';
import { SessionStore } from '../session/session.store';
import { Shortcuts } from '../ui/shortcuts.service';
import { PanelKey, ShellPanels } from './panels';

interface MoreLink {
  readonly href: string;
  readonly icon: UiIconName;
  readonly label: string;
}

/** Folha "Mais" do celular: telas que não cabem na barra inferior, paleta, atalhos e perfil. */
@Component({
  selector: 'app-more-panel',
  imports: [TranslatePipe, AppIcon, AppAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    ul {
      display: grid;
      gap: 0.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    a,
    button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      min-height: 2.75rem;
      padding: 0 0.75rem;
      color: inherit;
      font: inherit;
      text-align: left;
      text-decoration: none;
      background: none;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
    }
    a:hover,
    button:hover {
      background: var(--ox-hover);
    }
    .who {
      display: grid;
      line-height: 1.25;
    }
  `,
  template: `
    <ul>
      @for (link of links(); track link.href) {
        <li>
          <a [attr.href]="link.href" (click)="panels.close()">
            <app-icon [name]="link.icon" [size]="1.125" />{{ link.label | t }}
          </a>
        </li>
      }
      <li>
        <button type="button" (click)="openPalette()">
          <app-icon name="search" [size]="1.125" />{{ 'palette.open' | t }}
        </button>
      </li>
      <li>
        <button type="button" (click)="openShortcuts()">
          <app-icon name="question-circle" [size]="1.125" />{{ 'shortcuts.title' | t }}
        </button>
      </li>
      <li>
        <button type="button" (click)="open('profile')">
          <app-avatar [name]="session.actor().name" size="small" />
          <span class="who">
            <span>{{ 'app.profile' | t }}</span>
            <small class="muted"
              >{{ session.actor().name }} · {{ 'role.' + session.currentRole() | t }}</small
            >
          </span>
        </button>
      </li>
    </ul>
  `,
})
export class MorePanel {
  protected readonly panels = inject(ShellPanels);
  protected readonly session = inject(SessionStore);
  private readonly shortcuts = inject(Shortcuts);

  protected readonly links = computed<MoreLink[]>(() => {
    const links: MoreLink[] = [];
    if (this.session.can('audit.view')) {
      links.push({ href: '#/analytics', icon: 'bar-chart', label: 'app.nav.analytics' });
    }
    links.push({ href: '#/admin', icon: 'safety', label: 'app.nav.admin' });
    if (this.session.can('request.create')) {
      links.push({ href: '#/requests/new', icon: 'plus-circle', label: 'app.nav.new' });
    }
    return links;
  });

  protected open(key: PanelKey): void {
    this.panels.open(key);
  }

  protected openPalette(): void {
    this.panels.close();
    this.shortcuts.openPalette();
  }

  protected openShortcuts(): void {
    this.panels.close();
    this.shortcuts.openHelp();
  }
}
