import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { UiIconName } from '../icons';
import { UiTheme } from '../theme/ui-theme';

export interface AppMenuItem {
  readonly key: string;
  readonly label: string;
  readonly icon?: UiIconName;
  /** Destino por hash (ex.: `#/inbox`). */
  readonly href: string;
  readonly badge?: number;
  /** `signal`: contador em amarelo (pede ação agora). Padrão: selo mono discreto. */
  readonly badgeTone?: 'signal' | 'muted';
}

export interface AppMenuGroup {
  readonly title?: string;
  readonly items: readonly AppMenuItem[];
}

/** Menu de navegação (sidebar e gaveta do celular). O item ativo recebe `aria-current`. */
@Component({
  selector: 'app-menu',
  imports: [NzMenuModule, NzIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul
      nz-menu
      nzMode="inline"
      [nzInlineCollapsed]="collapsed()"
      [nzTheme]="theme.mode()"
      class="app-menu"
    >
      @for (group of groups(); track $index) {
        @if (group.title && !collapsed()) {
          <li class="app-menu-title" aria-hidden="true">{{ group.title }}</li>
        }
        @for (item of group.items; track item.key) {
          <li nz-menu-item [nzSelected]="item.key === selectedKey()" nzMatchRouterExact="false">
            <a
              class="app-menu-link"
              [attr.href]="item.href"
              [attr.aria-current]="item.key === selectedKey() ? 'page' : null"
              [attr.aria-label]="collapsed() ? item.label : null"
              (click)="selected.emit(item.key)"
            >
              @if (item.icon) {
                <span nz-icon [nzType]="item.icon" aria-hidden="true"></span>
              }
              <span class="app-menu-label">{{ item.label }}</span>
              @if (item.badge) {
                <span
                  class="app-menu-badge"
                  [class.app-menu-badge-signal]="item.badgeTone === 'signal'"
                  [attr.aria-label]="item.badge + ''"
                  >{{
                  item.badge
                }}</span>
              }
            </a>
          </li>
        }
      }
    </ul>
  `,
})
export class AppMenu {
  protected readonly theme = inject(UiTheme);
  readonly groups = input.required<readonly AppMenuGroup[]>();
  readonly selectedKey = input('');
  readonly collapsed = input(false);
  readonly selected = output<string>();
}
