import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../core/i18n/translation.service';
import { AppCard, AppCardExtra, AppSegmented, AppSegmentedOption } from '../ui';

/**
 * Cartão de gráfico: título, descrição e alternância entre o gráfico (`[chart]`) e a mesma
 * informação em tabela (`[table]`), para leitor de tela e para quem prefere números.
 */
@Component({
  selector: 'app-chart-card',
  imports: [FormsModule, AppCard, AppCardExtra, AppSegmented],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card [title]="heading()">
      <div appCardExtra>
        <app-segmented
          [options]="options()"
          [value]="mode()"
          [ariaLabel]="i18n.translateDynamic('analytics.view')"
          (valueChange)="mode.set($any($event))"
        />
      </div>
      <p class="caption muted">{{ caption() }}</p>
      <div [hidden]="mode() !== 'chart'"><ng-content select="[chart]" /></div>
      <div [hidden]="mode() !== 'table'" class="table-wrap"><ng-content select="[table]" /></div>
    </app-card>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .caption {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
    }
    .table-wrap {
      overflow-x: auto;
    }
  `,
})
export class ChartCard {
  protected readonly i18n = inject(TranslationService);
  readonly heading = input.required<string>();
  readonly caption = input('');
  protected readonly mode = signal<'chart' | 'table'>('chart');
  protected readonly options = computed<AppSegmentedOption[]>(() => {
    this.i18n.locale();
    return [
      { value: 'chart', label: this.i18n.translateDynamic('analytics.asChart') },
      { value: 'table', label: this.i18n.translateDynamic('analytics.asTable') },
    ];
  });
}
