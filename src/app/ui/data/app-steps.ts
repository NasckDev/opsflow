import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NzStepsModule } from 'ng-zorro-antd/steps';

export type AppStepStatus = 'wait' | 'process' | 'finish' | 'error';

export interface AppStep {
  readonly title: string;
  readonly description?: string;
  readonly subtitle?: string;
  readonly status?: AppStepStatus;
  readonly icon?: string;
}

/** Passos (wizard e cadeia de aprovação). Sem `status`, vale a posição de `current`. */
@Component({
  selector: 'app-steps',
  imports: [NzStepsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-steps
      [nzCurrent]="current()"
      [nzDirection]="direction()"
      [nzSize]="size()"
      [nzLabelPlacement]="labelPlacement()"
      [attr.aria-label]="ariaLabel() || null"
    >
      @for (step of steps(); track step.title) {
        <nz-step
          [nzTitle]="step.title"
          [nzDescription]="step.description ?? ''"
          [nzSubtitle]="step.subtitle ?? ''"
          [nzStatus]="step.status ?? 'wait'"
          [nzIcon]="step.icon"
        ></nz-step>
      }
    </nz-steps>
  `,
})
export class AppSteps {
  readonly steps = input.required<readonly AppStep[]>();
  readonly current = input(0);
  readonly direction = input<'horizontal' | 'vertical'>('horizontal');
  readonly size = input<'default' | 'small'>('default');
  readonly labelPlacement = input<'horizontal' | 'vertical'>('horizontal');
  readonly ariaLabel = input('');
}
