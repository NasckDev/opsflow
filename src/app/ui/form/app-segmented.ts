import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface AppSegmentedOption {
  readonly value: string | number;
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: boolean;
}

let nextGroup = 0;

/**
 * Controle segmentado: escolhe uma entre poucas opções. Usa o visual `ant-segmented` com
 * botões de rádio nativos (o componente do NG-ZORRO marca `aria-selected` em um `div` sem papel,
 * o que o axe reprova).
 */
@Component({
  selector: 'app-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="ant-segmented"
      [class.ant-segmented-block]="block()"
      role="radiogroup"
      [attr.aria-label]="ariaLabel()"
    >
      <div class="ant-segmented-group">
        @for (option of options(); track option.value) {
          <label
            class="ant-segmented-item"
            [class.ant-segmented-item-selected]="option.value === value()"
            [class.ant-segmented-item-disabled]="option.disabled"
          >
            <input
              type="radio"
              class="ant-segmented-item-input"
              [attr.name]="name"
              [checked]="option.value === value()"
              [disabled]="option.disabled"
              (change)="value.set(option.value)"
            />
            <div class="ant-segmented-item-label">{{ option.label }}</div>
          </label>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .ant-segmented-item-selected {
      background: var(--ox-card);
      box-shadow: var(--ox-shadow-sm);
    }
    .ant-segmented-item:has(input:focus-visible) {
      outline: 2px solid var(--ox-color-focus-ring);
    }
  `,
})
export class AppSegmented {
  protected readonly name = `app-segmented-${nextGroup++}`;
  readonly options = input.required<readonly AppSegmentedOption[]>();
  readonly value = model<string | number>('');
  readonly ariaLabel = input('');
  readonly block = input(false);
}
