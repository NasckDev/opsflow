import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ROLES } from '../../domain/request.model';
import { AppAvatar, AppSegmented, AppSegmentedOption, AppSwitch, UiTheme } from '../../ui';
import { MockBackend } from '../api/mock-api.interceptor';
import { TranslatePipe } from '../i18n/translate.pipe';
import { TranslationService } from '../i18n/translation.service';
import { LOCALES, Locale } from '../i18n/translations';
import { DEMO_USERS, SessionStore } from '../session/session.store';

/** Perfil e preferências: papel de demonstração, idioma, tema, densidade e falhas simuladas. */
@Component({
  selector: 'app-profile-panel',
  imports: [FormsModule, TranslatePipe, AppAvatar, AppSegmented, AppSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .head {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .who {
      display: grid;
      line-height: 1.3;
    }
    fieldset {
      margin: 0 0 1rem;
      padding: 0;
      border: 0;
    }
    legend {
      width: auto;
      padding: 0;
      margin-bottom: 0.375rem;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .hint {
      margin-bottom: 0.5rem;
      color: var(--ox-color-text-muted);
    }
    .roles {
      display: grid;
      gap: 0.375rem;
    }
    .role {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      min-height: 2.75rem;
      padding: 0 0.75rem;
      cursor: pointer;
      border: 1px solid var(--ox-color-border);
      border-radius: 6px;
    }
    .role:has(input:checked) {
      background: var(--ox-color-accent-surface);
      border-color: var(--ox-color-accent);
    }
    .role:has(input:focus-visible) {
      outline: 2px solid var(--ox-color-focus-ring);
    }
    .role-text {
      display: grid;
      line-height: 1.25;
    }
    .switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 2.75rem;
    }
    .switch-text {
      display: grid;
      line-height: 1.3;
    }
  `,
  template: `
    <div class="head">
      <app-avatar [name]="session.actor().name" size="large" />
      <div class="who">
        <strong>{{ session.actor().name }}</strong>
        <span class="muted">{{ 'role.' + session.currentRole() | t }}</span>
      </div>
    </div>

    <fieldset>
      <legend>{{ 'app.profile.role' | t }}</legend>
      <p class="hint">{{ 'app.profile.roleHint' | t }}</p>
      <div class="roles">
        @for (role of roles; track role) {
          <label class="role">
            <input
              type="radio"
              name="demo-role"
              class="visually-hidden"
              [value]="role"
              [checked]="session.currentRole() === role"
              (change)="session.setRole(role)"
            />
            <app-avatar [name]="users[role]" size="small" />
            <span class="role-text">
              <span>{{ 'role.' + role | t }}</span>
              <small class="muted">{{ users[role] }}</small>
            </span>
          </label>
        }
      </div>
    </fieldset>

    <fieldset>
      <legend>{{ 'app.language' | t }}</legend>
      <app-segmented
        [options]="localeOptions"
        [ariaLabel]="'app.language' | t"
        [value]="i18n.locale()"
        (valueChange)="setLocale($event)"
      />
    </fieldset>

    <fieldset>
      <legend>{{ 'app.density' | t }}</legend>
      <app-segmented
        [options]="densityOptions()"
        [ariaLabel]="'app.density' | t"
        [value]="theme.density()"
        (valueChange)="setDensity($event)"
      />
    </fieldset>

    <fieldset>
      <legend>{{ 'app.profile.preferences' | t }}</legend>
      <div class="switch-row">
        <span class="switch-text">{{ 'app.theme.dark' | t }}</span>
        <app-switch
          [ariaLabel]="'app.theme.dark' | t"
          [ngModel]="theme.mode() === 'dark'"
          (ngModelChange)="theme.setMode($event ? 'dark' : 'light')"
        />
      </div>
      <div class="switch-row">
        <span class="switch-text">
          {{ 'app.simulateErrors' | t }}
          <small class="muted">{{ 'app.simulateErrorsHint' | t }}</small>
        </span>
        <app-switch
          [ariaLabel]="'app.simulateErrors' | t"
          [ngModel]="failures()"
          (ngModelChange)="failures.set($event)"
        />
      </div>
    </fieldset>
  `,
})
export class ProfilePanel {
  private readonly backend = inject(MockBackend);
  protected readonly session = inject(SessionStore);
  protected readonly i18n = inject(TranslationService);
  protected readonly theme = inject(UiTheme);
  protected readonly roles = ROLES;
  protected readonly users = DEMO_USERS;
  protected readonly failures = this.backend.failuresEnabled;
  protected readonly localeOptions: readonly AppSegmentedOption[] = LOCALES.map((locale) => ({
    value: locale,
    label: locale === 'en' ? 'English' : 'Português',
  }));
  protected readonly densityOptions = computed<AppSegmentedOption[]>(() => {
    this.i18n.locale();
    return (['compact', 'comfortable'] as const).map((value) => ({
      value,
      label: this.i18n.translateDynamic(`app.density.${value}`),
    }));
  });

  protected setLocale(locale: string | number): void {
    this.i18n.setLocale(locale as Locale);
  }

  protected setDensity(density: string | number): void {
    this.theme.setDensity(density === 'comfortable' ? 'comfortable' : 'compact');
  }
}
