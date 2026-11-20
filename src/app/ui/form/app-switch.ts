import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

/** Interruptor (CVA, boolean). `ariaLabel` dá o nome acessível. */
@Component({
  selector: 'app-switch',
  imports: [NzSwitchModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppSwitch), multi: true },
  ],
  template: `
    <nz-switch
      [ngModel]="checked()"
      (ngModelChange)="onToggle($event)"
      [nzDisabled]="isDisabled()"
      [nzLoading]="loading()"
    ></nz-switch>
  `,
})
export class AppSwitch implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly ariaLabel = input('');
  readonly loading = input(false);

  protected readonly checked = signal(false);
  protected readonly isDisabled = signal(false);
  private onChange: (value: boolean) => void = () => undefined;

  constructor() {
    afterRenderEffect(() => {
      const label = this.ariaLabel();
      this.checked();
      const button = this.host.nativeElement.querySelector('button');
      if (button && label) button.setAttribute('aria-label', label);
    });
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {
    // Sem estado de "tocado" para o interruptor.
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  protected onToggle(value: boolean): void {
    this.checked.set(value);
    this.onChange(value);
  }
}
