import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { UiIconName } from '../icons';

export interface AppDropdownItem {
  readonly key: string;
  readonly label: string;
  readonly icon?: UiIconName;
  readonly danger?: boolean;
  readonly disabled?: boolean;
}

/** Menu suspenso: o conteúdo projetado (um botão) abre a lista de ações. */
@Component({
  selector: 'app-dropdown',
  imports: [NzDropdownModule, NzIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="app-dropdown-trigger"
      nz-dropdown
      nzTrigger="click"
      [nzDropdownMenu]="menu"
      [nzPlacement]="placement()"
    >
      <ng-content />
    </span>
    <nz-dropdown-menu #menu="nzDropdownMenu">
      <ul nz-menu>
        @for (item of items(); track item.key) {
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
          <li
            nz-menu-item
            [nzDanger]="item.danger ?? false"
            [nzDisabled]="item.disabled ?? false"
            (click)="itemClick.emit(item.key)"
          >
            @if (item.icon) {
              <span nz-icon [nzType]="item.icon" aria-hidden="true"></span>
            }
            {{ item.label }}
          </li>
        }
      </ul>
    </nz-dropdown-menu>
  `,
})
export class AppDropdown {
  readonly items = input.required<readonly AppDropdownItem[]>();
  readonly placement = input<'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'>('bottomRight');
  readonly itemClick = output<string>();
}
