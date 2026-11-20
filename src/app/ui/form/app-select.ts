import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzSelectModule, NzSelectOptionInterface, NzSelectSizeType } from 'ng-zorro-antd/select';
import { UiTheme } from '../theme/ui-theme';

export interface AppSelectOption {
  readonly value: string | number;
  readonly label: string;
  readonly disabled?: boolean;
}

/** Lista suspensa (CVA). O valor é o `value` da opção escolhida. */
@Component({
  selector: 'app-select',
  imports: [NzSelectModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppSelect), multi: true },
  ],
  template: `
    <nz-select
      [nzOptions]="nzOptions()"
      [ngModel]="value()"
      (ngModelChange)="onSelect($event)"
      [nzDisabled]="isDisabled()"
      [nzPlaceHolder]="placeholder()"
      [nzAllowClear]="allowClear()"
      [nzSize]="nzSize()"
      [nzStatus]="invalid() ? 'error' : ''"
      [nzShowSearch]="searchable()"
      (nzOnSearch)="(0)"
      (nzBlur)="onTouched()"
    ></nz-select>
  `,
  styles: `
    :host {
      display: block;
    }
    nz-select {
      width: 100%;
    }
  `,
})
export class AppSelect implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly theme = inject(UiTheme);

  readonly options = input.required<readonly AppSelectOption[]>();
  readonly placeholder = input('');
  readonly allowClear = input(false);
  readonly searchable = input(false);
  readonly invalid = input(false);
  readonly size = input<'small' | 'middle' | 'large' | null>(null);
  readonly ariaLabel = input('');
  readonly inputId = input('');

  protected readonly value = signal<string | number | null>(null);
  protected readonly isDisabled = signal(false);
  protected readonly nzOptions = computed<NzSelectOptionInterface[]>(() =>
    this.options().map((option) => ({
      value: option.value,
      label: option.label,
      nzDisabled: option.disabled,
    })),
  );
  protected readonly nzSize = computed<NzSelectSizeType>(() => {
    const size = this.size();
    if (size === 'small') return 'small';
    if (size === 'large') return 'large';
    return this.theme.density() === 'comfortable' ? 'large' : 'default';
  });

  private onChange: (value: string | number | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor() {
    // O NG-ZORRO não expõe rótulo para o campo de busca interno: aplicamos aqui.
    afterRenderEffect(() => {
      const label = this.ariaLabel();
      const id = this.inputId();
      const input = this.host.nativeElement.querySelector<HTMLInputElement>('input');
      if (!input) return;
      if (label) input.setAttribute('aria-label', label);
      if (id) input.id = id;
      this.value();
    });
  }

  writeValue(value: string | number | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  protected onSelect(value: string | number | null): void {
    this.value.set(value);
    this.onChange(value);
  }
}
