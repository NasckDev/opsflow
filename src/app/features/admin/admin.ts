import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { DEMO_USERS, SessionStore } from '../../core/session/session.store';
import { ToastService } from '../../core/ui/toast.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { PERMISSIONS, can } from '../../domain/permissions';
import { ROLES, Role } from '../../domain/request.model';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';

const RULES = [
  { icon: 'users', key: 'admin.rule.separation' },
  { icon: 'comment', key: 'admin.rule.comment' },
  { icon: 'clock', key: 'admin.rule.sla' },
  { icon: 'lock', key: 'admin.rule.auditor' },
] as const;

@Component({
  selector: 'app-admin',
  imports: [TranslatePipe, Avatar, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  protected readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);

  protected readonly roles = ROLES;
  protected readonly permissions = PERMISSIONS;
  protected readonly users = ROLES.map((role) => ({ role, name: DEMO_USERS[role] }));
  protected readonly rules = RULES;

  protected allowed(role: Role, permission: (typeof PERMISSIONS)[number]): boolean {
    return can(role, permission);
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
