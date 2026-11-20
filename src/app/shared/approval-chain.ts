import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { LocalDatePipe } from '../core/i18n/format.pipes';
import { ChainStep, ChainStepState } from '../domain/approval-chain';
import { Icon, IconName } from './icon';

const STATE_ICONS: Readonly<Record<ChainStepState, IconName>> = {
  done: 'check',
  current: 'clock',
  pending: 'ban',
  rejected: 'x',
  returned: 'undo',
};

/** Cadeia de aprovação: quem já agiu, quem é o próximo e onde parou. */
@Component({
  selector: 'app-approval-chain',
  imports: [TranslatePipe, LocalDatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    ol {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      --tone: var(--ox-color-border-strong);
      position: relative;
      display: grid;
      justify-items: center;
      gap: 0.25rem;
      padding: 0 var(--ox-space-1);
      text-align: center;
      line-height: 1.3;
    }
    li::before {
      content: '';
      position: absolute;
      top: 1.1875rem;
      left: calc(-50% + 1.375rem);
      right: calc(50% + 1.375rem);
      height: 2px;
      background: var(--ox-color-border);
    }
    li:first-child::before {
      display: none;
    }
    li[data-state='done']::before {
      background: var(--ox-color-success);
    }
    li[data-state='done'] {
      --tone: var(--ox-color-success);
    }
    li[data-state='current'] {
      --tone: var(--ox-color-warning);
    }
    li[data-state='returned'] {
      --tone: var(--ox-color-violet);
    }
    li[data-state='rejected'] {
      --tone: var(--ox-color-danger);
    }
    .node {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      width: 2.375rem;
      height: 2.375rem;
      color: var(--tone);
      background: var(--ox-card);
      border: 2px solid var(--tone);
      border-radius: 50%;
    }
    li[data-state='done'] .node {
      color: var(--ox-color-text-on-accent);
      background: var(--ox-color-success);
    }
    li[data-state='current'] .node {
      animation: pulse 2s ease-in-out infinite;
    }
    .name {
      font-weight: var(--ox-font-weight-semibold);
      font-size: var(--ox-font-size-sm);
    }
    small {
      max-width: 100%;
      overflow-wrap: anywhere;
      color: var(--ox-color-text-muted);
      font-size: var(--ox-font-size-xs);
    }
    .step-state {
      font-size: var(--ox-font-size-xs);
      font-weight: var(--ox-font-weight-semibold);
      color: var(--tone);
    }
    @keyframes pulse {
      50% {
        box-shadow: 0 0 0 5px color-mix(in srgb, var(--tone) 22%, transparent);
      }
    }
  `,
  template: `
    <ol [attr.aria-label]="'chain.title' | t">
      @for (step of steps(); track step.id) {
        <li [attr.data-state]="step.state">
          <span class="node"><app-icon [name]="icon(step.state)" [size]="1" /></span>
          <span class="name">{{ 'chain.' + step.id | t }}</span>
          <span class="step-state">{{ 'chain.state.' + step.state | t }}</span>
          @if (step.actor) {
            <small>{{ step.actor }}</small>
          } @else {
            <small>{{ 'role.' + step.role | t }}</small>
          }
          @if (step.at) {
            <small>{{ step.at | localDate }}</small>
          }
        </li>
      }
    </ol>
  `,
})
export class ApprovalChain {
  readonly steps = input.required<readonly ChainStep[]>();

  protected icon(state: ChainStepState): IconName {
    return STATE_ICONS[state];
  }
}
