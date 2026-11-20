import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { UiIconName } from '../icons';

/** Ícone do Ant Design. `size` em rem. Decorativo, a menos que `label` seja informado. */
@Component({
  selector: 'app-icon',
  imports: [NzIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[style.font-size.rem]': 'size()',
    '[style.display]': '"inline-flex"',
    '[style.line-height]': '"1"',
  },
  template: `<span nz-icon [nzType]="name()" [nzTheme]="theme()" [nzSpin]="spin()"></span>`,
})
export class AppIcon {
  readonly name = input.required<UiIconName>();
  readonly size = input(1);
  readonly spin = input(false);
  readonly label = input('');
  readonly filled = input(false);
  protected readonly theme = computed(() => (this.filled() ? 'fill' : 'outline'));
}
