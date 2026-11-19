import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TranslatePipe } from './core/i18n/translate.pipe';
import { SearchStore } from './core/search/search.store';
import { SessionStore } from './core/session/session.store';
import { ProfileMenu } from './core/shell/profile-menu';
import { Avatar } from './shared/avatar';
import { Icon } from './shared/icon';
import { Logo } from './shared/logo';

const NEW_REQUEST_PATH = '/requests/new';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, TranslatePipe, Icon, Logo, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  protected readonly session = inject(SessionStore);
  protected readonly search = inject(SearchStore);
  protected readonly profile = inject(ProfileMenu);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  protected readonly onNew = computed(() => this.url() === NEW_REQUEST_PATH);
  protected readonly onList = computed(() => this.url().startsWith('/requests') && !this.onNew());

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    if (this.url() !== '/requests') void this.router.navigateByUrl('/requests');
  }

  protected clearSearch(): void {
    this.search.clear();
  }

  protected toggleProfile(event: Event): void {
    this.profile.toggle(event.currentTarget as HTMLElement);
  }

  protected focusMain(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }
}
