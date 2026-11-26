import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LocalDatePipe } from '../core/i18n/format.pipes';
import { TranslationService } from '../core/i18n/translation.service';
import { ViewportService } from '../core/ui/viewport.service';
import { ChainStep, ChainStepState } from '../domain/approval-chain';
import { AppStep, AppStepStatus, AppSteps } from '../ui';

const STATUS: Readonly<Record<ChainStepState, AppStepStatus>> = {
  done: 'finish',
  current: 'process',
  pending: 'wait',
  optional: 'wait',
  skipped: 'wait',
  rejected: 'error',
  returned: 'error',
};

const ICONS: Partial<Record<ChainStepState, string>> = {
  returned: 'undo',
  rejected: 'close-circle',
};

/** Cadeia de aprovação (solicitação, revisão, aprovação, conclusão) como passos do Ant Design. */
@Component({
  selector: 'app-approval-chain',
  imports: [AppSteps],
  providers: [LocalDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-steps
      [steps]="items()"
      [current]="current()"
      [direction]="viewport.compact() ? 'vertical' : 'horizontal'"
      [ariaLabel]="i18n.translateDynamic('chain.title')"
      size="small"
    />
  `,
})
export class ApprovalChain {
  protected readonly i18n = inject(TranslationService);
  protected readonly viewport = inject(ViewportService);
  private readonly date = inject(LocalDatePipe);

  readonly steps = input.required<readonly ChainStep[]>();

  protected readonly current = computed(() => {
    const index = this.steps().findIndex((step) => step.state === 'current');
    return index >= 0 ? index : this.steps().filter((step) => step.state === 'done').length;
  });

  protected readonly items = computed<AppStep[]>(() => {
    this.i18n.locale();
    const t = (key: string) => this.i18n.translateDynamic(key);
    return this.steps().map((step) => {
      const who =
        step.state === 'optional'
          ? t('chain.optionalHint')
          : (step.actor ?? t(`role.${step.role}`));
      const parts = [who];
      if (step.at) parts.push(this.date.transform(step.at));
      return {
        title: t(`chain.${step.id}`),
        subtitle: t(`chain.state.${step.state}`),
        description: parts.join(' · '),
        status: STATUS[step.state],
        icon: ICONS[step.state],
      };
    });
  });
}
