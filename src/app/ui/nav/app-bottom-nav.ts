import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppBadge } from '../data/app-badge';
import { AppIcon } from '../icon/app-icon';
import { UiIconName } from '../icons';

export interface AppBottomNavItem {
  readonly key: string;
  readonly label: string;
  readonly icon: UiIconName;
  /** Destino por hash; sem `href`, o item é um botão (ex.: "Mais"). */
  readonly href?: string;
  readonly badge?: number;
}

/** Barra inferior do celular: alvos de 44 px, item ativo com `aria-current`. */
@Component({
  selector: 'app-bottom-nav',
  imports: [AppIcon, AppBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="app-bottom-nav" [attr.aria-label]="ariaLabel()">
      @for (item of items(); track item.key) {
        @if (item.href) {
          <a
            class="app-bottom-nav-item"
            [class.active]="item.key === activeKey()"
            [attr.href]="item.href"
            [attr.aria-current]="item.key === activeKey() ? 'page' : null"
          >
            <app-badge [count]="item.badge ?? 0" tone="primary">
              <app-icon [name]="item.icon" [size]="1.375" />
            </app-badge>
            <span>{{ item.label }}</span>
          </a>
        } @else {
          <button
            type="button"
            class="app-bottom-nav-item"
            [class.active]="item.key === activeKey()"
            aria-haspopup="dialog"
            (click)="pressed.emit(item.key)"
          >
            <app-icon [name]="item.icon" [size]="1.375" />
            <span>{{ item.label }}</span>
          </button>
        }
      }
    </nav>
  `,
})
export class AppBottomNav {
  readonly items = input.required<readonly AppBottomNavItem[]>();
  readonly activeKey = input('');
  readonly ariaLabel = input('Navegação principal');
  readonly pressed = output<string>();
}
