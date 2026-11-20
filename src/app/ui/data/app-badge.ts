import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NzBadgeComponent } from 'ng-zorro-antd/badge';

/** Contador sobre o conteúdo (ou sozinho, com `standalone`). Zero fica oculto. */
@Component({
  selector: 'app-badge',
  imports: [NzBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-badge
      [nzCount]="count()"
      [nzOverflowCount]="99"
      [nzDot]="dot()"
      [nzStandalone]="standalone()"
      [class]="'app-badge-' + tone()"
    >
      <ng-content />
    </nz-badge>
  `,
})
export class AppBadge {
  readonly count = input(0);
  readonly dot = input(false);
  readonly standalone = input(false);
  readonly tone = input<'danger' | 'primary'>('danger');
}
