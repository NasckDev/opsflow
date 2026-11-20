import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NzProgressComponent, NzProgressStatusType } from 'ng-zorro-antd/progress';

/** Barra de progresso com nome acessível e `role="progressbar"` correto. */
@Component({
  selector: 'app-progress',
  imports: [NzProgressComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="progressbar"
      [attr.aria-label]="label()"
      aria-valuemin="0"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuenow]="value()"
    >
      <nz-progress
        aria-hidden="true"
        [nzPercent]="percent()"
        [nzStatus]="status()"
        [nzShowInfo]="showInfo()"
        [nzSize]="size()"
      ></nz-progress>
    </div>
  `,
})
export class AppProgress {
  readonly value = input.required<number>();
  readonly max = input(100);
  readonly label = input.required<string>();
  readonly status = input<NzProgressStatusType>('normal');
  readonly showInfo = input(false);
  readonly size = input<'default' | 'small'>('small');
  protected readonly percent = computed(() =>
    this.max() > 0 ? Math.min(100, (this.value() / this.max()) * 100) : 0,
  );
}
