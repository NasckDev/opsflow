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
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Converte "2026-11-20T18:00" (fuso local) em Date. */
export function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Converte Date em "2026-11-20T18:00" (fuso local). */
export function formatLocalDateTime(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Seletor de data e hora (CVA). O valor é uma string `aaaa-mm-ddThh:mm` no fuso local. */
@Component({
  selector: 'app-date-picker',
  imports: [NzDatePickerModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppDatePicker), multi: true },
  ],
  template: `
    <nz-date-picker
      [ngModel]="date()"
      (ngModelChange)="onPick($event)"
      [nzShowTime]="showTime() ? { nzFormat: 'HH:mm' } : false"
      [nzFormat]="format()"
      [nzDisabled]="isDisabled()"
      [nzStatus]="invalid() ? 'error' : ''"
      [nzPlaceHolder]="placeholder()"
      [nzAllowClear]="false"
      (nzOnOpenChange)="onTouched()"
    ></nz-date-picker>
  `,
  styles: `
    :host {
      display: block;
    }
    nz-date-picker {
      width: 100%;
    }
  `,
})
export class AppDatePicker implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly showTime = input(true);
  readonly invalid = input(false);
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly inputId = input('');
  readonly describedBy = input('');

  protected readonly date = signal<Date | null>(null);
  protected readonly isDisabled = signal(false);
  protected readonly format = computed(() => (this.showTime() ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'));
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor() {
    afterRenderEffect(() => {
      const label = this.ariaLabel();
      const id = this.inputId();
      const describedBy = this.describedBy();
      const invalid = this.invalid();
      this.date();
      const input = this.host.nativeElement.querySelector<HTMLInputElement>('input');
      if (!input) return;
      if (label) input.setAttribute('aria-label', label);
      if (id) input.id = id;
      if (describedBy) input.setAttribute('aria-describedby', describedBy);
      if (invalid) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
  }

  writeValue(value: string | null): void {
    this.date.set(value ? parseLocalDateTime(value) : null);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  protected onPick(value: Date | null): void {
    this.date.set(value);
    this.onChange(value ? formatLocalDateTime(value) : '');
  }
}
