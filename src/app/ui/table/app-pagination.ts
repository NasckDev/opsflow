import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  model,
} from '@angular/core';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

/** Paginação simples (usada nas listas de cartões). */
@Component({
  selector: 'app-pagination',
  imports: [NzPaginationModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-pagination
      [nzTotal]="total()"
      [nzPageSize]="pageSize()"
      [nzPageIndex]="page()"
      (nzPageIndexChange)="page.set($event)"
      [nzSimple]="simple()"
      [nzHideOnSinglePage]="true"
    ></nz-pagination>
  `,
})
export class AppPagination {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // O campo da paginação simples não tem rótulo no NG-ZORRO: nomeamos aqui.
    afterRenderEffect(() => {
      const label = this.pageLabel();
      this.page();
      this.host.nativeElement.querySelectorAll('input').forEach((field) => field.setAttribute('aria-label', label));
    });
  }

  readonly pageLabel = input('Página');
  readonly total = input.required<number>();
  readonly pageSize = input(10);
  readonly page = model(1);
  readonly simple = input(true);
}
