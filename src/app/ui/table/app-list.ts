import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  contentChild,
  input,
} from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';

/** Lista de itens (cartões no celular). Modelo do item: `<ng-template let-item>…</ng-template>`. */
@Component({
  selector: 'app-list',
  imports: [NzListModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="app-list" [attr.aria-label]="ariaLabel() || null">
      @for (item of data(); track keyOf(item); let index = $index) {
        <li class="app-list-item">
          <ng-container
            *ngTemplateOutlet="itemTemplate(); context: { $implicit: item, index: index }"
          />
        </li>
      }
    </ul>
    <ng-content />
  `,
  styles: `
    :host {
      display: block;
    }
    .app-list {
      display: grid;
      gap: 0.625rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
  `,
})
export class AppList {
  readonly data = input.required<readonly unknown[]>();
  readonly trackBy = input<(item: never) => string>((item: never) =>
    String((item as { id?: unknown }).id),
  );
  readonly ariaLabel = input('');
  protected readonly itemTemplate = contentChild.required(TemplateRef);

  protected keyOf(item: unknown): string {
    return (this.trackBy() as (value: unknown) => string)(item);
  }
}
