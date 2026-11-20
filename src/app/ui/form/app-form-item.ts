import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';

/**
 * Rótulo + campo + dica + erro. O erro vira `role="alert"` e a dica e o erro têm ids
 * previsíveis (`<forId>-hint`, `<forId>-error`) para o campo apontar com `aria-describedby`.
 */
@Component({
  selector: 'app-form-item',
  imports: [NzFormModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ant-form ant-form-vertical' },
  template: `
    <nz-form-item>
      <nz-form-label [nzFor]="forId()" [nzRequired]="required()" nzNoColon>{{
        label()
      }}</nz-form-label>
      <nz-form-control [nzValidateStatus]="error() ? 'error' : ''">
        <ng-content />
        @if (error(); as message) {
          <div
            class="ant-form-item-explain-error app-form-error"
            role="alert"
            [id]="forId() + '-error'"
          >
            {{ message }}
          </div>
        }
        @if (hint(); as text) {
          <div class="ant-form-item-extra" [id]="forId() + '-hint'">{{ text }}</div>
        }
      </nz-form-control>
    </nz-form-item>
  `,
})
export class AppFormItem {
  readonly label = input.required<string>();
  readonly forId = input.required<string>();
  readonly required = input(false);
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
}
