import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { useFocusReturn } from './focus-return';

/**
 * Diálogo modal. Foco preso, Esc fecha e o foco volta a quem abriu (NG-ZORRO).
 * Ações no rodapé: conteúdo com `appModalFooter` e `[footer]="true"`.
 */
@Component({
  selector: 'app-modal',
  imports: [NzModalModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-modal
      [nzVisible]="open()"
      (nzVisibleChange)="onVisibleChange($event)"
      [nzTitle]="title()"
      [nzFooter]="footer() ? footerTpl : null"
      [nzWidth]="width()"
      [nzCentered]="centered()"
      [nzClosable]="closable()"
      [nzMaskClosable]="maskClosable()"
      [nzClassName]="className()"
      [nzAutofocus]="autofocus()"
      (nzOnCancel)="closed.emit()"
    >
      <ng-container *nzModalContent><ng-content /></ng-container>
    </nz-modal>
    <ng-template #footerTpl><ng-content select="[appModalFooter]" /></ng-template>
  `,
})
export class AppModal {
  constructor() {
    useFocusReturn(this.open);
  }

  readonly open = model(false);
  readonly title = input('');
  readonly width = input<number | string>(520);
  readonly centered = input(true);
  readonly closable = input(true);
  readonly maskClosable = input(true);
  readonly footer = input(false);
  readonly className = input('app-modal');
  readonly autofocus = input<'ok' | 'cancel' | 'auto' | null>('auto');
  readonly closed = output<void>();

  protected onVisibleChange(visible: boolean): void {
    this.open.set(visible);
  }
}
