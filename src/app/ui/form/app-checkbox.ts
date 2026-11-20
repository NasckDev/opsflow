import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

/** Caixa de seleção (CVA, boolean). O texto vem do conteúdo; sem texto, use `ariaLabel`. */
@Component({
  selector: 'app-checkbox',
  imports: [NzCheckboxModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppCheckbox), multi: true },
  ],
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
    <label
      nz-checkbox
      [ngModel]="checked()"
      (ngModelChange)="onToggle($event)"
      [nzDisabled]="isDisabled()"
      [nzIndeterminate]="indeterminate()"
      [attr.aria-label]="ariaLabel() || null"
    >
      <ng-content />
    </label>
  `,
})
export class AppCheckbox implements ControlValueAccessor {
  readonly ariaLabel = input('');
  readonly indeterminate = input(false);

  protected readonly checked = signal(false);
  protected readonly isDisabled = signal(false);
  private onChange: (value: boolean) => void = () => undefined;

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {
    // Sem estado de "tocado" para esta caixa.
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  protected onToggle(value: boolean): void {
    this.checked.set(value);
    this.onChange(value);
  }
}
