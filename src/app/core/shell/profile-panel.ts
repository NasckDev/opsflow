import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ROLES, Role } from '../../domain/request.model';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { MockBackend } from '../api/mock-api.interceptor';
import { TranslatePipe } from '../i18n/translate.pipe';
import { TranslationService } from '../i18n/translation.service';
import { LOCALES, Locale } from '../i18n/translations';
import { DEMO_USERS, SessionStore } from '../session/session.store';
import { ThemeService } from '../theme/theme.service';
import { ProfileMenu } from './profile-menu';

@Component({
  selector: 'app-profile-panel',
  imports: [CdkTrapFocus, TranslatePipe, Avatar, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-panel.html',
  styleUrl: './profile-panel.scss',
})
export class ProfilePanel {
  private readonly menu = inject(ProfileMenu);
  private readonly backend = inject(MockBackend);
  protected readonly session = inject(SessionStore);
  protected readonly i18n = inject(TranslationService);
  protected readonly theme = inject(ThemeService);
  protected readonly roles = ROLES;
  protected readonly locales = LOCALES;
  protected readonly users = DEMO_USERS;
  protected readonly failures = this.backend.failuresEnabled;

  protected setRole(role: Role): void {
    this.session.setRole(role);
  }

  protected setLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }

  protected localeLabel(locale: Locale): string {
    return locale === 'en' ? 'English' : 'Português';
  }

  protected onFailures(event: Event): void {
    this.failures.set((event.target as HTMLInputElement).checked);
  }

  protected close(): void {
    this.menu.close();
  }
}
