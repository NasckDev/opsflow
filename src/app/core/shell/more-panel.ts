import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { TranslatePipe } from '../i18n/translate.pipe';
import { SessionStore } from '../session/session.store';
import { Shortcuts } from '../ui/shortcuts.service';
import { Popover } from './popover';
import { ProfilePanel } from './profile-panel';

/** Folha "Mais" do celular: o que não cabe na barra inferior. */
@Component({
  selector: 'app-more-panel',
  imports: [CdkTrapFocus, RouterLink, TranslatePipe, Avatar, Icon],
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
    a,
    button.row {
      display: flex;
      align-items: center;
      gap: var(--ox-space-3);
      width: 100%;
      min-height: var(--ox-tap);
      padding: 0 var(--ox-space-3);
      color: var(--ox-color-text);
      font-weight: var(--ox-font-weight-medium);
      text-align: left;
      text-decoration: none;
      background: transparent;
      border: 0;
      border-radius: var(--ox-radius-md);
      cursor: pointer;
    }
    a:hover,
    button.row:hover {
      background: var(--ox-hover);
    }
    .who {
      display: grid;
      line-height: 1.25;
    }
    small {
      font-weight: var(--ox-font-weight-regular);
      color: var(--ox-color-text-muted);
    }
  `,
  template: `
    <div
      class="popover-card"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="'app.nav.more' | t"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
    >
      <header>
        <h2>{{ 'app.nav.more' | t }}</h2>
        <button
          type="button"
          class="btn btn-ghost btn-icon"
          [attr.aria-label]="'app.close' | t"
          (click)="close()"
        >
          <app-icon name="x" />
        </button>
      </header>
      <ul>
        @if (session.can('audit.view')) {
          <li>
            <a routerLink="/analytics" (click)="close(false)"
              ><app-icon name="chart" />{{ 'app.nav.analytics' | t }}</a
            >
          </li>
        }
        <li>
          <a routerLink="/admin" (click)="close(false)"
            ><app-icon name="shield" />{{ 'app.nav.admin' | t }}</a
          >
        </li>
        @if (session.can('request.create')) {
          <li>
            <a routerLink="/requests/new" (click)="close(false)"
              ><app-icon name="plusCircle" />{{ 'app.nav.new' | t }}</a
            >
          </li>
        }
        <li>
          <button type="button" class="row" (click)="openPalette()">
            <app-icon name="command" />{{ 'palette.open' | t }}
          </button>
        </li>
        <li>
          <button type="button" class="row" (click)="openShortcuts()">
            <app-icon name="keyboard" />{{ 'shortcuts.title' | t }}
          </button>
        </li>
        <li>
          <button type="button" class="row" (click)="openProfile()">
            <app-avatar [name]="session.actor().name" size="sm" />
            <span class="who">
              {{ 'app.profile' | t }}
              <small>{{ session.actor().name }} · {{ 'role.' + session.currentRole() | t }}</small>
            </span>
          </button>
        </li>
      </ul>
    </div>
  `,
})
export class MorePanel {
  protected readonly session = inject(SessionStore);
  private readonly popover = inject(Popover);
  private readonly shortcuts = inject(Shortcuts);

  protected close(restoreFocus = true): void {
    this.popover.close(restoreFocus);
  }

  protected openProfile(): void {
    this.popover.swap('profile', ProfilePanel);
  }

  protected openPalette(): void {
    this.popover.close(false);
    this.shortcuts.openPalette();
  }

  protected openShortcuts(): void {
    this.popover.close(false);
    this.shortcuts.openHelp();
  }
}
