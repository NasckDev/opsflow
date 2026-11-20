import { ChangeDetectionStrategy, Component, Directive, contentChild, input } from '@angular/core';
import { NzCardComponent } from 'ng-zorro-antd/card';

/** Marca o conteúdo que vai no canto do cabeçalho do `app-card`. */
@Directive({ selector: '[appCardExtra]' })
export class AppCardExtra {}

/** Cartão. Conteúdo padrão no corpo; `[appCardExtra]` vai no canto do cabeçalho. */
@Component({
  selector: 'app-card',
  imports: [NzCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card
      [nzTitle]="title() ? titleTpl : undefined"
      [nzExtra]="extra() ? extraTpl : undefined"
      [nzBodyStyle]="flush() ? { padding: 0 } : null"
      [nzBordered]="bordered()"
      [nzHoverable]="hoverable()"
      [nzLoading]="loading()"
      [nzSize]="size()"
    >
      <ng-content />
    </nz-card>
    <ng-template #titleTpl>
      <h2 class="app-card-title" [id]="headingId() || null">{{ title() }}</h2>
    </ng-template>
    <ng-template #extraTpl><ng-content select="[appCardExtra]" /></ng-template>
  `,
  styles: `
    :host {
      display: block;
    }
    .app-card-title {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
    }
  `,
})
export class AppCard {
  readonly title = input('');
  readonly headingId = input('');
  readonly bordered = input(true);
  readonly hoverable = input(false);
  readonly loading = input(false);
  /** Sem preenchimento no corpo (tabelas e listas que vão até a borda). */
  readonly flush = input(false);
  protected readonly extra = contentChild(AppCardExtra);
  readonly size = input<'default' | 'small'>('default');
}
