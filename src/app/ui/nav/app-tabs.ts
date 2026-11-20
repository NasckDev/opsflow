import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

export interface AppTab {
  readonly key: string;
  readonly label: string;
  readonly count?: number;
}

/**
 * Abas. Só desenha a barra: o painel da aba ativa é o conteúdo projetado, e quem usa
 * decide o que mostrar a partir de `activeKey`.
 */
@Component({
  selector: 'app-tabs',
  imports: [NzTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-tabs
      [nzSelectedIndex]="index()"
      (nzSelectedIndexChange)="select($event)"
      [nzType]="type()"
      [nzAnimated]="false"
      [nzSize]="size()"
    >
      @for (tab of tabs(); track tab.key) {
        <nz-tab [nzTitle]="titleTpl"></nz-tab>
        <ng-template #titleTpl>
          {{ tab.label }}
          @if (tab.count !== undefined) {
            <span class="app-tab-count">{{ tab.count }}</span>
          }
        </ng-template>
      }
    </nz-tabs>
    <ng-content />
  `,
})
export class AppTabs {
  readonly tabs = input.required<readonly AppTab[]>();
  readonly activeKey = model('');
  readonly type = input<'line' | 'card'>('line');
  readonly size = input<'default' | 'small'>('default');
  protected readonly index = computed(() =>
    Math.max(
      0,
      this.tabs().findIndex((tab) => tab.key === this.activeKey()),
    ),
  );

  protected select(index: number): void {
    const tab = this.tabs()[index];
    if (tab) this.activeKey.set(tab.key);
  }
}
