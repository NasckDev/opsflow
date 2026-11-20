import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { useFocusReturn } from './focus-return';

export type AppDrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

/** Gaveta lateral ou inferior (navegação, notificações, perfil e "Mais" no celular). */
@Component({
  selector: 'app-drawer',
  imports: [NzDrawerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-drawer
      [nzVisible]="open()"
      [nzPlacement]="placement()"
      [nzTitle]="title()"
      [nzWidth]="width()"
      [nzHeight]="height()"
      [nzClosable]="true"
      [nzMaskClosable]="true"
      [nzWrapClassName]="'app-drawer app-drawer-' + placement()"
      (nzOnClose)="close()"
    >
      <ng-container *nzDrawerContent><ng-content /></ng-container>
    </nz-drawer>
  `,
})
export class AppDrawer {
  constructor() {
    useFocusReturn(this.open);
  }

  readonly open = model(false);
  readonly title = input('');
  readonly placement = input<AppDrawerPlacement>('right');
  readonly width = input<number | string>(400);
  readonly height = input<number | string>('auto');
  readonly closed = output<void>();

  protected close(): void {
    this.open.set(false);
    this.closed.emit();
  }
}
