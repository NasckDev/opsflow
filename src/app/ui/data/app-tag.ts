import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzTagComponent } from 'ng-zorro-antd/tag';
import { UiIconName } from '../icons';

export type AppTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral';

/**
 * Etiqueta. Com `checkable`, vira um botão de filtro (`aria-pressed`) acessível pelo teclado.
 * As cores vêm dos tokens do tema (pares verificados em AA nos dois temas).
 */
@Component({
  selector: 'app-tag',
  imports: [NzTagComponent, NzIconDirective, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (checkable()) {
      <button
        type="button"
        class="ant-tag ant-tag-checkable app-tag-button"
        [class.ant-tag-checkable-checked]="checked()"
        [attr.aria-pressed]="checked()"
        (click)="toggle()"
      >
        @if (icon(); as iconName) {
          <span nz-icon [nzType]="iconName" aria-hidden="true"></span>
        }
        <ng-container *ngTemplateOutlet="body" />
      </button>
    } @else {
      <nz-tag [class]="'app-tone app-tone-' + tone()" [nzBordered]="bordered()">
        @if (icon(); as iconName) {
          <span nz-icon [nzType]="iconName" aria-hidden="true"></span>
        }
        <ng-container *ngTemplateOutlet="body" />
      </nz-tag>
    }
    <ng-template #body><ng-content /></ng-template>
  `,
})
export class AppTag {
  readonly tone = input<AppTone>('default');
  readonly icon = input<UiIconName | null>(null);
  readonly bordered = input(true);
  readonly checkable = input(false);
  readonly checked = model(false);
  readonly toggled = output<boolean>();

  protected toggle(): void {
    // Controlado por quem usa: o novo valor sai em `toggled`; `checked` só muda se o pai mudar.
    this.toggled.emit(!this.checked());
  }
}
