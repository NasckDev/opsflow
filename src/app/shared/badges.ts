import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { RequestStatus, WorkflowRequest } from '../domain/request.model';
import { evaluateSla } from '../domain/sla';

@Component({
  selector: 'app-status-badge',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [attr.data-status]="status()">{{ 'status.' + status() | t }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<RequestStatus>();
}

@Component({
  selector: 'app-sla-badge',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [attr.data-sla]="sla().state">
      @if (sla().state === 'breached' || sla().state === 'at_risk') {
        <span aria-hidden="true">⚠ </span>
      }
      {{ 'sla.' + sla().state | t: { hours: sla().hoursRemaining } }}
    </span>
  `,
})
export class SlaBadge {
  readonly request = input.required<Pick<WorkflowRequest, 'dueAt' | 'status'>>();
  protected readonly sla = computed(() => evaluateSla(this.request(), new Date()));
}
