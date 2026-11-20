import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NzBadgeComponent } from 'ng-zorro-antd/badge';

export type AppStatusKind = 'success' | 'processing' | 'default' | 'error' | 'warning';

/** Ponto de estado com texto (nunca só a cor: o texto é obrigatório). */
@Component({
  selector: 'app-status',
  imports: [NzBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<nz-badge [nzStatus]="status()" [nzText]="label()"></nz-badge>`,
})
export class AppStatus {
  readonly status = input<AppStatusKind>('default');
  readonly label = input.required<string>();
}
