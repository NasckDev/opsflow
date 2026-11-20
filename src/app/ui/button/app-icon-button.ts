import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NzButtonComponent, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { UiIconName } from '../icons';
import { UiTheme } from '../theme/ui-theme';
import { AppButtonSize, AppButtonVariant } from './app-button';

/** Botão só com ícone. `label` é obrigatório: vira o nome acessível. */
@Component({
  selector: 'app-icon-button',
  imports: [NzButtonComponent, NzIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      nz-button
      nzShape="circle"
      [nzType]="variant()"
      [nzSize]="nzSize()"
      [nzDanger]="danger()"
      [nzLoading]="loading()"
      [disabled]="disabled()"
      type="button"
      [attr.aria-label]="label()"
      [attr.aria-expanded]="expanded()"
      [attr.aria-haspopup]="haspopup()"
    >
      <span nz-icon [nzType]="icon()"></span>
    </button>
  `,
})
export class AppIconButton {
  private readonly theme = inject(UiTheme);

  readonly icon = input.required<UiIconName>();
  readonly label = input.required<string>();
  readonly variant = input<AppButtonVariant>('text');
  readonly size = input<AppButtonSize | null>(null);
  readonly danger = input(false);
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly expanded = input<boolean | null>(null);
  readonly haspopup = input<'dialog' | 'menu' | null>(null);

  protected readonly nzSize = computed<NzButtonSize>(() => {
    const size = this.size();
    if (size === 'small') return 'small';
    if (size === 'large') return 'large';
    return this.theme.density() === 'comfortable' ? 'large' : 'default';
  });
}
