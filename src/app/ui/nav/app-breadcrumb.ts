import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

export interface AppBreadcrumbItem {
  readonly label: string;
  /** Destino por hash; sem `href`, é a página atual. */
  readonly href?: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [NzBreadCrumbModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [attr.aria-label]="ariaLabel()">
      <nz-breadcrumb>
        @for (item of items(); track item.label; let last = $last) {
          <nz-breadcrumb-item>
            @if (item.href && !last) {
              <a [attr.href]="item.href">{{ item.label }}</a>
            } @else {
              <span [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
            }
          </nz-breadcrumb-item>
        }
      </nz-breadcrumb>
    </nav>
  `,
})
export class AppBreadcrumb {
  readonly items = input.required<readonly AppBreadcrumbItem[]>();
  readonly ariaLabel = input('Trilha de navegação');
}
