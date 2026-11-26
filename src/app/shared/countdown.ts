import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { NowService } from '../core/time/now.service';
import { WorkflowRequest } from '../domain/request.model';
import { evaluateSla, formatCountdown, formatHours, slaOutcome } from '../domain/sla';
import { AppIcon } from '../ui';

/** Contagem regressiva do SLA: selo amarelo perto de vencer, borda laranja vencido (sempre com texto e ícone). */
@Component({
  selector: 'app-countdown',
  imports: [TranslatePipe, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-sla]': 'sla().state' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.3125rem;
      padding: 2px 8px;
      font-family: var(--ox-font-family-mono);
      font-size: 0.8125rem;
      font-weight: 600;
      line-height: 1.25rem;
      color: var(--ox-color-text-soft);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      border: 1px solid transparent;
      border-radius: var(--ox-radius-sm);
    }
    /* Perto de vencer: amarelo de sinalização preenchido (pede ação agora). */
    :host([data-sla='at_risk']) {
      color: var(--ox-color-text-on-accent);
      background: var(--ox-color-accent);
    }
    /* Vencido: borda laranja e o texto "atraso". */
    :host([data-sla='breached']) {
      color: var(--ox-color-danger);
      border-color: var(--ox-color-danger);
    }
    :host([data-sla='closed']) {
      padding-inline: 0;
      color: var(--ox-color-text-muted);
      font-family: var(--ox-font-family-sans);
      font-weight: 500;
      white-space: normal;
    }
  `,
  template: `
    @if (sla().state === 'breached' || sla().state === 'at_risk') {
      <app-icon [name]="sla().state === 'breached' ? 'exclamation-circle' : 'clock-circle'" [size]="0.8125" />
    }
    @switch (sla().state) {
      @case ('closed') {
        @if (outcome(); as result) {
          {{ (result.late ? 'sla.decidedLate' : 'sla.decidedOnTime') | t: { time: outcomeTime() } }}
        } @else {
          {{ 'sla.closed' | t }}
        }
      }
      @case ('breached') {
        {{ 'sla.overdueShort' | t: { time: time() } }}
      }
      @default {
        {{ time() }}
      }
    }
  `,
})
export class Countdown {
  readonly request = input.required<Pick<WorkflowRequest, 'dueAt' | 'status' | 'audit'>>();
  private readonly clock = inject(NowService);
  protected readonly sla = computed(() => evaluateSla(this.request(), this.clock.now()));
  protected readonly outcome = computed(() => slaOutcome(this.request()));
  protected readonly outcomeTime = computed(() => formatHours(this.outcome()?.hours ?? 0));
  protected readonly time = computed(() =>
    formatCountdown(Date.parse(this.request().dueAt) - this.clock.now().getTime()),
  );
}
