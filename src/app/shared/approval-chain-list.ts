import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShortDatePipe } from '../core/i18n/format.pipes';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { ChainStep } from '../domain/approval-chain';
import { AppIcon } from '../ui';

/**
 * Cadeia de aprovação compacta (painel de detalhe da caixa de entrada): concluído em verde,
 * a etapa em andamento com o anel amarelo e as seguintes em cinza. Cada estado também tem texto.
 */
@Component({
  selector: 'app-approval-chain-list',
  imports: [TranslatePipe, ShortDatePipe, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    ol {
      display: grid;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      position: relative;
      display: grid;
      grid-template-columns: 1.5rem minmax(0, 1fr);
      gap: 0.75rem;
      padding-bottom: 0.875rem;
    }
    li:last-child {
      padding-bottom: 0;
    }
    li:not(:last-child)::before {
      content: '';
      position: absolute;
      top: 1.5rem;
      bottom: 0.125rem;
      left: 0.6875rem;
      width: 1px;
      background: var(--ox-color-border);
    }
    .mark {
      display: grid;
      place-items: center;
      width: 1.375rem;
      height: 1.375rem;
      font-size: 0.75rem;
      color: var(--ox-color-step-idle);
      border: 2px solid var(--ox-color-border-soft);
      border-radius: 50%;
    }
    [data-state='done'] .mark {
      color: var(--ox-color-text-on-accent);
      background: var(--ox-color-success-solid);
      border-color: var(--ox-color-success-solid);
    }
    /* Anel amarelo no escuro; no claro, o tom de texto do amarelo (contraste de traço 3:1). */
    [data-state='current'] .mark {
      background: var(--ox-color-bg);
      border-color: var(--ox-color-accent-text);
    }
    [data-state='rejected'] .mark,
    [data-state='returned'] .mark {
      color: var(--ox-color-danger);
      border-color: var(--ox-color-danger);
    }
    [data-state='optional'] .mark,
    [data-state='skipped'] .mark {
      border-style: dashed;
    }
    .text {
      display: grid;
      gap: 0.125rem;
      min-width: 0;
    }
    .who {
      font-size: 0.875rem;
      font-weight: 600;
    }
    [data-state='pending'] .who,
    [data-state='optional'] .who,
    [data-state='skipped'] .who {
      color: var(--ox-color-text-soft);
    }
    .state {
      color: var(--ox-color-text-muted);
      font-size: 0.8125rem;
    }
    [data-state='current'] .state {
      color: var(--ox-color-accent-text);
    }
    time {
      font-family: var(--ox-font-family-mono);
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--ox-color-text-muted);
    }
  `,
  template: `
    <ol [attr.aria-label]="'chain.title' | t">
      @for (step of steps(); track step.id) {
        <li [attr.data-state]="step.state">
          <span class="mark" aria-hidden="true">
            @switch (step.state) {
              @case ('done') {
                <app-icon name="check" [size]="0.75" />
              }
              @case ('rejected') {
                <app-icon name="close" [size]="0.6875" />
              }
              @case ('returned') {
                <app-icon name="undo" [size]="0.6875" />
              }
            }
          </span>
          <span class="text">
            <span class="who">
              {{ 'chain.' + step.id | t }}:
              {{
                step.state === 'optional'
                  ? ('role.' + step.role | t)
                  : (step.actor ?? ('role.' + step.role | t))
              }}
            </span>
            <span class="state">
              {{
                (step.state === 'optional' ? 'chain.optionalHint' : 'chain.state.' + step.state) | t
              }}
            </span>
            @if (step.at) {
              <time [attr.datetime]="step.at">{{ step.at | shortDate }}</time>
            }
          </span>
        </li>
      }
    </ol>
  `,
})
export class ApprovalChainList {
  readonly steps = input.required<readonly ChainStep[]>();
}
