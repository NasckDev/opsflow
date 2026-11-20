import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AppDrawer, AppMenu, AppMenuGroup } from '../../ui';
import { TranslatePipe } from '../i18n/translate.pipe';
import { CommandPalette } from '../ui/command-palette';
import { CommentPromptHost } from '../ui/comment-prompt';
import { ShortcutsDialog } from '../ui/shortcuts-dialog';
import { ViewportService } from '../ui/viewport.service';
import { MorePanel } from './more-panel';
import { NotificationPanel } from './notification-panel';
import { ShellPanels } from './panels';
import { ProfilePanel } from './profile-panel';

/**
 * Gavetas, paleta, atalhos e pedido de comentário. Carregado só quando alguém abre um deles
 * (o `@defer` do shell), para ficar fora do bundle inicial.
 */
@Component({
  selector: 'app-shell-overlays',
  imports: [
    TranslatePipe,
    AppDrawer,
    AppMenu,
    CommandPalette,
    CommentPromptHost,
    ShortcutsDialog,
    MorePanel,
    NotificationPanel,
    ProfilePanel,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<app-drawer
  [open]="panels.openKey() === 'menu'"
  [title]="'OpsFlow'"
  placement="left"
  [width]="viewport.mobile() ? 300 : 320"
  (closed)="panels.close()"
>
  <nav [attr.aria-label]="'app.nav.main' | t">
    <app-menu [groups]="menu()" [selectedKey]="section()" (selected)="panels.close()" />
  </nav>
</app-drawer>

<app-drawer
  [open]="panels.openKey() === 'notifications'"
  [title]="'notifications.title' | t"
  [placement]="viewport.mobile() ? 'bottom' : 'right'"
  [width]="400"
  [height]="'75%'"
  (closed)="panels.close()"
>
  <app-notification-panel />
</app-drawer>

<app-drawer
  [open]="panels.openKey() === 'profile'"
  [title]="'app.profile' | t"
  [placement]="viewport.mobile() ? 'bottom' : 'right'"
  [width]="400"
  [height]="'85%'"
  (closed)="panels.close()"
>
  <app-profile-panel />
</app-drawer>

<app-drawer
  [open]="panels.openKey() === 'more'"
  [title]="'app.nav.more' | t"
  placement="bottom"
  height="auto"
  (closed)="panels.close()"
>
  <app-more-panel />
</app-drawer>


<app-command-palette />
<app-shortcuts-dialog />
<app-comment-prompt />
  `,
})
export class ShellOverlays {
  protected readonly panels = inject(ShellPanels);
  protected readonly viewport = inject(ViewportService);
  readonly menu = input.required<readonly AppMenuGroup[]>();
  readonly section = input.required<string>();
}
