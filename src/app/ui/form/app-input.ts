import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { UiIconName } from '../icons';

export type AppInputType = 'text' | 'number' | 'search' | 'password' | 'textarea';

/** Campo de texto (CVA). Valor: string; para `type="number"`, number ou null. */
@Component({
  selector: 'app-input',
  imports: [NzInputModule, NzIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppInput), multi: true }],
  template: `
    @if (type() === 'textarea') {
      <textarea
        nz-input
        [attr.id]="inputId() || null"
        [attr.rows]="rows()"
        [attr.maxlength]="maxlength()"
        [attr.placeholder]="placeholder() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="describedBy() || null"
        [disabled]="isDisabled()"
        [value]="text()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      ></textarea>
    } @else {
      <nz-input-wrapper>
        @if (prefixIcon(); as iconName) {
          <span nzInputPrefix nz-icon [nzType]="iconName" aria-hidden="true"></span>
        }
        <input
          nz-input
          [attr.id]="inputId() || null"
          [attr.type]="type() === 'number' ? 'number' : type()"
          [attr.inputmode]="inputmode() || null"
          [attr.min]="min()"
          [attr.max]="max()"
          [attr.step]="step()"
          [attr.maxlength]="maxlength()"
          [attr.placeholder]="placeholder() || null"
          [attr.autocomplete]="autocomplete()"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [attr.aria-describedby]="describedBy() || null"
          [disabled]="isDisabled()"
          [value]="text()"
          (input)="onInput($event)"
          (blur)="onTouched()"
        />
        @if (clearable() && text()) {
          <button
            nzInputSuffix
            type="button"
            class="app-input-clear"
            [attr.aria-label]="clearLabel()"
            (click)="clear()"
          >
            <span nz-icon nzType="close-circle" nzTheme="fill" aria-hidden="true"></span>
          </button>
        }
      </nz-input-wrapper>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    textarea {
      width: 100%;
    }
    .app-input-clear {
      display: grid;
      place-items: center;
      padding: 0;
      color: var(--ox-color-text-muted);
      background: none;
      border: 0;
      cursor: pointer;
    }
  `,
})
export class AppInput implements ControlValueAccessor {
  readonly type = input<AppInputType>('text');
  readonly placeholder = input('');
  readonly inputId = input('');
  readonly ariaLabel = input('');
  readonly describedBy = input('');
  readonly invalid = input(false);
  readonly maxlength = input<number | null>(null);
  readonly rows = input(3);
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly step = input<number | string | null>(null);
  readonly inputmode = input('');
  readonly autocomplete = input('off');
  readonly prefixIcon = input<UiIconName | null>(null);
  readonly clearable = input(false);
  readonly clearLabel = input('Limpar');

  protected readonly text = signal('');
  protected readonly isDisabled = signal(false);
  private onChange: (value: string | number | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | number | null): void {
    this.text.set(value === null || value === undefined ? '' : String(value));
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

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.text.set(raw);
    this.emit(raw);
  }

  protected clear(): void {
    this.text.set('');
    this.emit('');
  }

  private emit(raw: string): void {
    if (this.type() === 'number') {
      const parsed = raw === '' ? null : Number(raw);
      this.onChange(parsed === null || Number.isNaN(parsed) ? null : parsed);
    } else {
      this.onChange(raw);
    }
  }
}
