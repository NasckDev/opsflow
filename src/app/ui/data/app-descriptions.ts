import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  contentChildren,
  input,
  viewChild,
} from '@angular/core';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';

/** Um campo de `app-descriptions`: o conteúdo é o valor. */
@Component({
  selector: 'app-descriptions-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-template #body><ng-content /></ng-template>`,
})
export class AppDescriptionsItem {
  readonly label = input.required<string>();
  readonly body = viewChild.required<TemplateRef<unknown>>('body');
}

/** Lista de campos rótulo/valor (detalhe da solicitação). */
@Component({
  selector: 'app-descriptions',
  imports: [NzDescriptionsModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-descriptions
      [nzColumn]="column()"
      [nzBordered]="bordered()"
      nzSize="small"
      [nzLayout]="layout()"
      [nzColon]="false"
    >
      @for (item of items(); track item.label()) {
        <nz-descriptions-item [nzTitle]="item.label()">
          <ng-container *ngTemplateOutlet="item.body()" />
        </nz-descriptions-item>
      }
    </nz-descriptions>
  `,
})
export class AppDescriptions {
  readonly column = input<number | Record<string, number>>({ xs: 1, sm: 2, md: 3 });
  readonly bordered = input(false);
  readonly layout = input<'horizontal' | 'vertical'>('vertical');
  protected readonly items = contentChildren(AppDescriptionsItem);
}
