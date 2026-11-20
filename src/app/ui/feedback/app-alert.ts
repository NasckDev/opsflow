import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzAlertComponent } from 'ng-zorro-antd/alert';

export type AppAlertType = 'success' | 'info' | 'warning' | 'error';

/** Aviso em linha. Ações opcionais no conteúdo projetado. */
@Component({
  selector: 'app-alert',
  imports: [NzAlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-alert
      [nzType]="type()"
      [nzMessage]="message()"
      [nzDescription]="description() || null"
      [nzShowIcon]="showIcon()"
      [nzCloseable]="closable()"
      [nzAction]="actionTpl"
      (nzOnClose)="closed.emit()"
    ></nz-alert>
    <ng-template #actionTpl><ng-content /></ng-template>
  `,
})
export class AppAlert {
  readonly type = input<AppAlertType>('info');
  readonly message = input.required<string>();
  readonly description = input('');
  readonly showIcon = input(true);
  readonly closable = input(false);
  readonly closed = output<void>();
}
