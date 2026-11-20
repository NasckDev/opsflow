import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NzResultModule, NzResultStatusType } from 'ng-zorro-antd/result';

/** Resultado de página inteira: erro, acesso negado, não encontrado ou sucesso. */
@Component({
  selector: 'app-result',
  imports: [NzResultModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-result [nzStatus]="status()" [nzTitle]="title()" [nzSubTitle]="description() || ''">
      <div nz-result-extra><ng-content /></div>
    </nz-result>
  `,
})
export class AppResult {
  readonly status = input<NzResultStatusType>('info');
  readonly title = input.required<string>();
  readonly description = input('');
}
