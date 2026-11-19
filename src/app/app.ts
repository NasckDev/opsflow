import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MockBackend } from './core/api/mock-api.interceptor';
import { TranslatePipe } from './core/i18n/translate.pipe';
import { TranslationService } from './core/i18n/translation.service';
import { LOCALES, Locale } from './core/i18n/translations';
import { SessionStore } from './core/session/session.store';
import { ThemeService } from './core/theme/theme.service';
import { ROLES, Role } from './domain/request.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly session = inject(SessionStore);
  protected readonly i18n = inject(TranslationService);
  protected readonly theme = inject(ThemeService);
  protected readonly backend = inject(MockBackend);
  protected readonly roles = ROLES;
  protected readonly locales = LOCALES;

  protected onRole(event: Event): void {
    this.session.setRole((event.target as HTMLSelectElement).value as Role);
  }

  protected onLocale(event: Event): void {
    this.i18n.setLocale((event.target as HTMLSelectElement).value as Locale);
  }

  protected onFailures(event: Event): void {
    this.backend.failuresEnabled.set((event.target as HTMLInputElement).checked);
  }
}
