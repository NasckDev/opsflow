import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NzButtonComponent, NzButtonSize, NzButtonType } from 'ng-zorro-antd/button';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { UiIconName } from '../icons';
import { UiTheme } from '../theme/ui-theme';

export type AppButtonVariant = 'primary' | 'default' | 'dashed' | 'text' | 'link';
export type AppButtonSize = 'small' | 'middle' | 'large';
export type AppButtonTone = 'default' | 'success';

const SIZES: Readonly<Record<AppButtonSize, NzButtonSize>> = {
  small: 'small',
  middle: 'default',
  large: 'large',
};

/**
 * Botão do app (contrato: variant, size, loading, disabled, icon, danger).
 * `tone="success"` é uma extensão do OpsFlow para decisões positivas (aprovar).
 */
@Component({
  selector: 'app-button',
  imports: [NzButtonComponent, NzIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-button-block]': 'block()',
    '[class.app-button-success]': 'tone() === "success"',
  },
  template: `
    <button
      nz-button
      [nzType]="nzType()"
      [nzSize]="nzSize()"
      [nzLoading]="loading()"
      [nzDanger]="danger()"
      [nzBlock]="block()"
      [disabled]="disabled()"
      [attr.type]="htmlType()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-pressed]="pressed()"
    >
      @if (icon(); as iconName) {
        <span nz-icon [nzType]="iconName"></span>
      }
      <span class="app-button-label"><ng-content /></span>
    </button>
  `,
})
export class AppButton {
  private readonly theme = inject(UiTheme);

  readonly variant = input<AppButtonVariant>('default');
  readonly size = input<AppButtonSize | null>(null);
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly icon = input<UiIconName | null>(null);
  readonly danger = input(false);
  readonly block = input(false);
  readonly tone = input<AppButtonTone>('default');
  readonly htmlType = input<'button' | 'submit' | 'reset'>('button');
  readonly ariaLabel = input('');
  readonly pressed = input<boolean | null>(null);

  protected readonly nzType = computed<NzButtonType>(() => this.variant());
  /** Sem `size`, a densidade do tema decide: compacta = padrão, confortável = grande. */
  protected readonly nzSize = computed<NzButtonSize>(() => {
    const size = this.size();
    if (size) return SIZES[size];
    return this.theme.density() === 'comfortable' ? 'large' : 'default';
  });
}
