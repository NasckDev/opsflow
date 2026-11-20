import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { DEMO_USERS, SessionStore } from '../../core/session/session.store';
import { ToastService } from '../../core/ui/toast.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { PERMISSIONS, can } from '../../domain/permissions';
import { ROLES, Role } from '../../domain/request.model';
import { ViewportService } from '../../core/ui/viewport.service';
import {
  AppAvatar,
  AppButton,
  AppCard,
  AppIcon,
  AppList,
  AppPageHeader,
  AppTable,
  AppTableCell,
  AppTableColumn,
  AppTag,
  UiIconName,
} from '../../ui';

const RULES: readonly { readonly icon: UiIconName; readonly key: string }[] = [
  { icon: 'team', key: 'admin.rule.separation' },
  { icon: 'message', key: 'admin.rule.comment' },
  { icon: 'clock-circle', key: 'admin.rule.sla' },
  { icon: 'lock', key: 'admin.rule.auditor' },
];

@Component({
  selector: 'app-admin',
  imports: [
    TranslatePipe,
    AppAvatar,
    AppButton,
    AppCard,
    AppIcon,
    AppList,
    AppPageHeader,
    AppTable,
    AppTableCell,
    AppTag,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  protected readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);

  protected readonly viewport = inject(ViewportService);
  protected readonly roles = ROLES;
  protected readonly roleRows = ROLES.map((role) => ({ id: role, role }));
  protected readonly permissionRows = PERMISSIONS.map((permission) => ({ id: permission, permission }));
  protected readonly matrixColumns = computed<AppTableColumn[]>(() => {
    this.i18n.locale();
    return [
      { key: 'permission', title: this.i18n.translateDynamic('admin.permission') },
      ...ROLES.map((role) => ({
        key: role,
        title: this.i18n.translateDynamic(`role.${role}`),
        align: 'center' as const,
      })),
    ];
  });
  protected readonly permissions = PERMISSIONS;
  protected readonly users = DEMO_USERS;
  protected readonly rules = RULES;

  protected userName(role: Role): string {
    return DEMO_USERS[role];
  }

  protected permissionOf(row: unknown): (typeof PERMISSIONS)[number] {
    return (row as { permission: (typeof PERMISSIONS)[number] }).permission;
  }

  protected granted(role: Role): (typeof PERMISSIONS)[number][] {
    return this.permissions.filter((permission) => can(role, permission));
  }

  protected allowed(role: Role, permission: (typeof PERMISSIONS)[number]): boolean {
    return can(role, permission);
  }

  protected hasAny(role: Role): boolean {
    return this.permissions.some((permission) => can(role, permission));
  }

  protected actAs(role: Role): void {
    this.session.setRole(role);
    const message = this.i18n.translateDynamic('admin.actingAs', {
      role: this.i18n.translateDynamic(`role.${role}`),
      name: DEMO_USERS[role],
    });
    this.toast.show(message, 'info');
  }
}
