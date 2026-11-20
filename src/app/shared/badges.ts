import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { Priority, RequestStatus, WorkflowRequest } from '../domain/request.model';
import { evaluateSla, formatHours, slaElapsedRatio, slaOutcome } from '../domain/sla';
import { AppIcon, AppProgress, AppTag, AppTone, UiIconName } from '../ui';

const STATUS_TONES: Readonly<Record<RequestStatus, AppTone>> = {
  draft: 'neutral',
  in_review: 'warning',
  returned: 'violet',
  approved: 'success',
  rejected: 'danger',
  completed: 'info',
};

const STATUS_ICONS: Readonly<Record<RequestStatus, UiIconName>> = {
  draft: 'file-text',
  in_review: 'clock-circle',
  returned: 'undo',
  approved: 'check-circle',
  rejected: 'close-circle',
  completed: 'check',
};

/** Status da solicitação: cor semântica, ícone e texto (nunca só a cor). */
@Component({
  selector: 'app-status-badge',
  imports: [TranslatePipe, AppTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-tag [tone]="tone()" [icon]="icon()" [attr.data-status]="status()">{{
    'status.' + status() | t
  }}</app-tag>`,
})
export class StatusBadge {
  readonly status = input.required<RequestStatus>();
  readonly large = input(false);
  protected readonly tone = computed(() => STATUS_TONES[this.status()]);
  protected readonly icon = computed(() => STATUS_ICONS[this.status()]);
}

const PRIORITY_ICONS: Readonly<Record<Priority, UiIconName>> = {
  high: 'arrow-up',
  medium: 'minus',
  low: 'arrow-down',
};

@Component({
  selector: 'app-priority',
  imports: [TranslatePipe, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-priority]': 'priority()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      white-space: nowrap;
    }
    :host([data-priority='high']) app-icon {
      color: var(--ox-color-danger);
    }
    :host([data-priority='medium']) app-icon {
      color: var(--ox-color-warning);
    }
    :host([data-priority='low']) app-icon {
      color: var(--ox-color-text-muted);
    }
  `,
  template: `<app-icon [name]="icon()" />{{ 'priority.' + priority() | t }}`,
})
export class PriorityBadge {
  readonly priority = input.required<Priority>();
  protected readonly icon = computed(() => PRIORITY_ICONS[this.priority()]);
}

/** Indicador de SLA: tempo restante em texto e barra de prazo consumido, colorida por risco. */
@Component({
  selector: 'app-sla-meter',
  imports: [TranslatePipe, AppIcon, AppProgress],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-sla]': 'sla().state', '[class.large]': 'large()' },
  styles: `
    :host {
      --sla-color: var(--ox-color-success);
      display: grid;
      gap: 0.3125rem;
      min-width: 7rem;
    }
    :host([data-sla='at_risk']) {
      --sla-color: var(--ox-color-warning);
    }
    :host([data-sla='breached']) {
      --sla-color: var(--ox-color-danger);
    }
    :host([data-sla='closed']) {
      --sla-color: var(--ox-color-text-muted);
    }
    .label {
      display: inline-flex;
      align-items: center;
      gap: 0.3125rem;
      font-size: var(--ox-font-size-xs);
      font-weight: var(--ox-font-weight-semibold);
      color: var(--sla-color);
      white-space: nowrap;
    }
    .bar {
      height: 0.25rem;
      border-radius: var(--ox-radius-full);
      background: var(--ox-neutral-surface);
      overflow: hidden;
    }
    .fill {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--sla-color);
      opacity: 0.85;
    }
    :host(.large) {
      min-width: 12rem;
    }
    :host(.large) .label {
      font-size: var(--ox-font-size-sm);
    }
    :host(.large) .bar {
      height: 0.375rem;
    }
  `,
  template: `
    <span class="label">
      @if (sla().state === 'breached' || sla().state === 'at_risk') {
        <app-icon name="exclamation-circle" [size]="0.875" />
      }
      @switch (sla().state) {
        @case ('breached') {
          {{ 'sla.breached' | t: { time: time() } }}
        }
        @case ('at_risk') {
          {{ 'sla.at_risk' | t: { time: time() } }}
        }
        @case ('closed') {
          @if (outcome(); as result) {
            {{ (result.late ? 'sla.decidedLate' : 'sla.decidedOnTime') | t: { time: outcomeTime() } }}
          } @else {
            {{ 'sla.closed' | t }}
          }
        }
        @default {
          {{ 'sla.on_track' | t: { time: time() } }}
        }
      }
    </span>
    <app-progress class="bar" [value]="percent()" [label]="'detail.sla' | t" size="small" />
  `,
})
export class SlaMeter {
  readonly request = input.required<
    Pick<WorkflowRequest, 'createdAt' | 'dueAt' | 'status' | 'audit'>
  >();
  readonly large = input(false);
  private readonly now = new Date();
  protected readonly sla = computed(() => evaluateSla(this.request(), this.now));
  protected readonly time = computed(() => formatHours(Math.abs(this.sla().hoursRemaining)));
  protected readonly outcome = computed(() => slaOutcome(this.request()));
  protected readonly outcomeTime = computed(() => formatHours(this.outcome()?.hours ?? 0));
  protected readonly percent = computed(() => slaElapsedRatio(this.request(), this.now) * 100);
}
