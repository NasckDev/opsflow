import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { NowService } from '../core/time/now.service';
import { WorkflowRequest } from '../domain/request.model';
import { evaluateSla, formatCountdown, formatHours, slaOutcome } from '../domain/sla';
import { AppIcon } from '../ui';

/** Contagem regressiva do SLA, com cor e ícone por risco (nunca só cor). */
@Component({
  selector: 'app-countdown',
  imports: [TranslatePipe, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-sla]': 'sla().state' },
  styles: `
    :host {
      --tone: var(--ox-color-success);
      display: inline-flex;
      align-items: center;
      gap: 0.3125rem;
      font-family: var(--ox-font-family-mono);
      font-size: var(--ox-font-size-xs);
      font-weight: var(--ox-font-weight-medium);
      color: var(--tone);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    :host([data-sla='at_risk']) {
      --tone: var(--ox-color-warning);
    }
    :host([data-sla='breached']) {
      --tone: var(--ox-color-danger);
    }
    :host([data-sla='closed']) {
      --tone: var(--ox-color-text-muted);
      white-space: normal;
    }
  `,
  template: `
    <app-icon [name]="sla().state === 'breached' ? 'exclamation-circle' : 'clock-circle'" [size]="0.875" />
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
