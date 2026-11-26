import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChildren,
  inject,
  input,
  output,
} from '@angular/core';
import { NzTableModule, NzTableSize } from 'ng-zorro-antd/table';
import { UiIconName } from '../icons';
import { AppIcon } from '../icon/app-icon';
import { UiTheme } from '../theme/ui-theme';

export type AppSortDirection = 'asc' | 'desc';

export interface AppTableColumn {
  readonly key: string;
  readonly title: string;
  readonly width?: string;
  readonly align?: 'left' | 'right' | 'center';
  readonly sortable?: boolean;
}

export interface AppTableSort {
  readonly key: string;
  readonly direction: AppSortDirection | null;
}

/** Modelo de célula: `<ng-template appTableCell="titulo" let-row>…</ng-template>`; a chave `*` vale para as demais colunas (`let-key="key"`). */
@Directive({ selector: 'ng-template[appTableCell]' })
export class AppTableCell {
  readonly key = input.required<string>({ alias: 'appTableCell' });
  readonly template = inject<TemplateRef<{ $implicit: unknown; key: string }>>(TemplateRef);
}

/**
 * Tabela com ordenação controlada, paginação e estado vazio. A ordenação é feita por
 * quem usa (evento `sortChange`); o cabeçalho é um botão, então funciona pelo teclado.
 */
@Component({
  selector: 'app-table',
  imports: [NzTableModule, NgTemplateOutlet, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-table
      #table
      [nzData]="data()"
      [nzPageSize]="pageSize()"
      [nzPageSizeOptions]="pageSizeOptions()"
      [nzShowSizeChanger]="false"
      [nzShowPagination]="data().length > pageSize()"
      [nzLoading]="loading()"
      [nzSize]="nzSize()"
      [nzShowTotal]="totalTpl"
      [nzNoResult]="emptyTpl"
    >
      <thead>
        <tr>
          @for (column of columns(); track column.key) {
            <th
              [nzAlign]="column.align ?? 'left'"
              [nzWidth]="column.width ?? null"
              [attr.aria-sort]="ariaSort(column)"
            >
              @if (column.sortable) {
                <button
                  type="button"
                  class="app-table-sort"
                  [attr.aria-label]="sortLabel() + ' ' + column.title"
                  (click)="cycle(column)"
                >
                  {{ column.title }}<app-icon [name]="sortIcon(column)" [size]="0.75" />
                </button>
              } @else {
                {{ column.title }}
              }
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of table.data; track keyOf(row)) {
          <tr>
            @for (column of columns(); track column.key) {
              <td [nzAlign]="column.align ?? 'left'">
                @if (cellTemplate(column.key); as tpl) {
                  <ng-container
                    *ngTemplateOutlet="tpl; context: { $implicit: row, key: column.key }"
                  />
                }
              </td>
            }
          </tr>
        }
      </tbody>
    </nz-table>
    <ng-template #totalTpl let-total>{{ totalLabel()(total) }}</ng-template>
    <ng-template #emptyTpl><ng-content select="[appTableEmpty]" /></ng-template>
  `,
  styles: `
    /* Tabela larga rola dentro da própria caixa, nunca a página. */
    :host {
      display: block;
      max-width: 100%;
      overflow-x: auto;
    }
  `,
})
export class AppTable {
  private readonly theme = inject(UiTheme);

  readonly columns = input.required<readonly AppTableColumn[]>();
  readonly data = input.required<readonly unknown[]>();
  readonly rowKey = input<(row: never) => string>((row: never) =>
    String((row as { id?: unknown }).id),
  );
  readonly loading = input(false);
  readonly pageSize = input(10);
  readonly pageSizes = input<readonly number[]>([10, 25, 50]);
  readonly sort = input<AppTableSort | null>(null);
  readonly sortLabel = input('Ordenar por');
  readonly totalLabel = input<(total: number) => string>((total) => `${total}`);
  readonly sortChange = output<AppTableSort>();

  private readonly cells = contentChildren(AppTableCell);
  protected readonly pageSizeOptions = computed(() => [...this.pageSizes()]);
  protected readonly nzSize = computed<NzTableSize>(() =>
    this.theme.density() === 'comfortable' ? 'middle' : 'small',
  );

  protected cellTemplate(key: string): TemplateRef<{ $implicit: unknown; key: string }> | null {
    const cells = this.cells();
    return (
      (cells.find((cell) => cell.key() === key) ?? cells.find((cell) => cell.key() === '*'))
        ?.template ?? null
    );
  }

  protected ariaSort(column: AppTableColumn): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) return null;
    const current = this.sort();
    if (current?.key !== column.key || !current.direction) return 'none';
    return current.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIcon(column: AppTableColumn): UiIconName {
    const current = this.sort();
    if (current?.key !== column.key || !current.direction) return 'swap';
    return current.direction === 'asc' ? 'caret-up' : 'caret-down';
  }

  /** Ciclo do cabeçalho: ascendente, descendente e sem ordenação. */
  protected cycle(column: AppTableColumn): void {
    const current = this.sort();
    let direction: AppSortDirection | null = 'asc';
    if (current?.key === column.key) direction = current.direction === 'asc' ? 'desc' : null;
    this.sortChange.emit({ key: column.key, direction });
  }

  protected keyOf(row: unknown): string {
    return (this.rowKey() as (value: unknown) => string)(row);
  }
}
