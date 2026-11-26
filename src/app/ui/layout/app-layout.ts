import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { UiTheme } from '../theme/ui-theme';

/**
 * Estrutura do console: barra superior em toda a largura (`[appLayoutHeader]`), e abaixo dela o
 * menu lateral recolhível (`[appLayoutSider]`) e o conteúdo. No celular (`mobile`), o sider some: a navegação vira gaveta e barra inferior.
 */
@Component({
  selector: 'app-layout',
  imports: [NzLayoutModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-layout class="app-layout" [class.app-layout-mobile]="mobile()">
      <nz-header class="app-header">
        <ng-content select="[appLayoutHeader]" />
      </nz-header>
      <nz-layout class="app-layout-body">
        @if (!mobile()) {
          <nz-sider
            class="app-sider"
            [nzWidth]="siderWidth()"
            [nzCollapsedWidth]="64"
            [nzCollapsed]="collapsed()"
            [nzTrigger]="null"
            nzCollapsible
            [nzTheme]="theme.mode()"
          >
            <ng-content select="[appLayoutSider]" />
          </nz-sider>
        }
        <nz-content class="app-content">
          <ng-content />
        </nz-content>
      </nz-layout>
    </nz-layout>
  `,
})
export class AppLayout {
  protected readonly theme = inject(UiTheme);
  readonly collapsed = model(false);
  readonly mobile = input(false);
  readonly siderWidth = input(210);
}
