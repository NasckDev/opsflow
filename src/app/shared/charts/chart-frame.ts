import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Icon } from '../icon';

/**
 * Moldura de gráfico: título, descrição para leitor de tela e alternância
 * entre o gráfico e a mesma informação em tabela.
 */
@Component({
  selector: 'app-chart-frame',
  imports: [TranslatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    figure {
      display: grid;
      gap: var(--ox-space-3);
      margin: 0;
      padding: var(--ox-space-4);
      background: var(--ox-card);
      border: 1px solid var(--ox-color-border);
      border-radius: var(--ox-radius-lg);
      box-shadow: var(--ox-shadow-sm);
      height: 100%;
    }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--ox-space-3);
    }
    h2 {
      margin: 0;
      font-size: var(--ox-font-size-sm);
      font-weight: var(--ox-font-weight-semibold);
    }
    p {
      margin: 0.125rem 0 0;
      font-size: var(--ox-font-size-xs);
      color: var(--ox-color-text-muted);
    }
    .toggle {
      display: inline-flex;
      padding: 2px;
      background: var(--ox-neutral-surface);
      border-radius: var(--ox-radius-md);
    }
    .toggle button {
      display: grid;
      place-items: center;
      width: 1.875rem;
      height: 1.75rem;
      color: var(--ox-color-text-muted);
      background: transparent;
      border: 0;
      border-radius: var(--ox-radius-sm);
      cursor: pointer;
    }
    .toggle button[aria-pressed='true'] {
      color: var(--ox-color-text);
      background: var(--ox-card);
      box-shadow: var(--ox-shadow-sm);
    }
    @media (max-width: 959px) {
      .toggle button {
        width: var(--ox-tap);
        height: var(--ox-tap);
      }
    }
  `,
  template: `
    <figure>
      <header>
        <div>
          <h2>{{ heading() }}</h2>
          <p>{{ caption() }}</p>
        </div>
        <div class="toggle" role="group" [attr.aria-label]="'analytics.view' | t">
          <button type="button" [attr.aria-pressed]="view() === 'chart'" [attr.aria-label]="'analytics.asChart' | t" (click)="view.set('chart')">
            <app-icon name="chart" [size]="1" />
          </button>
          <button type="button" [attr.aria-pressed]="view() === 'table'" [attr.aria-label]="'analytics.asTable' | t" (click)="view.set('table')">
            <app-icon name="list" [size]="1" />
          </button>
        </div>
      </header>
      @if (view() === 'chart') {
        <ng-content select="[chart]" />
      } @else {
        <ng-content select="[table]" />
      }
    </figure>
  `,
})
export class ChartFrame {
  readonly heading = input.required<string>();
  readonly caption = input('');
  protected readonly view = signal<'chart' | 'table'>('chart');
}
