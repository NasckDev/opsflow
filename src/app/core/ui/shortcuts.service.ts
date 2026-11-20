import { Dialog } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../i18n/translation.service';
import { Popover } from '../shell/popover';
import { Observable } from 'rxjs';

interface OpenDialog {
  close(): void;
  readonly closed: Observable<unknown>;
}

const SEQUENCE_TIMEOUT_MS = 1200;
const GO_ROUTES: Readonly<Record<string, string>> = {
  i: '/inbox',
  r: '/requests',
  b: '/board',
  a: '/analytics',
};

/** Texto digitável: atalhos de uma tecla ficam desligados enquanto o usuário escreve. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/** Atalhos globais: Ctrl/⌘+K, "?", "/" e sequências "g" + letra. */
@Injectable({ providedIn: 'root' })
export class Shortcuts {
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(TranslationService);
  private readonly popover = inject(Popover);
  private active: OpenDialog | null = null;
  private awaitingSecondKey = false;
  private sequenceTimer: ReturnType<typeof setTimeout> | undefined;

  start(): void {
    this.document.addEventListener('keydown', (event) => this.onKeydown(event));
  }

  /** A paleta é carregada só quando alguém a abre: fora do bundle inicial. */
  openPalette(): void {
    void import('./command-palette').then(({ CommandPalette }) =>
      this.openOnce(() =>
        this.dialog.open(CommandPalette, {
          ariaModal: true,
          ariaLabel: this.i18n.translateDynamic('palette.title'),
          panelClass: 'ox-dialog-panel',
          backdropClass: 'ox-dialog-backdrop',
          autoFocus: false,
        }),
      ),
    );
  }

  openHelp(): void {
    void import('./shortcuts-dialog').then(({ ShortcutsDialog }) =>
      this.openOnce(() =>
        this.dialog.open(ShortcutsDialog, {
          ariaModal: true,
          ariaLabelledBy: 'shortcuts-title',
          panelClass: 'ox-dialog-panel',
          backdropClass: 'ox-dialog-backdrop',
          autoFocus: false,
        }),
      ),
    );
  }

  private openOnce(open: () => OpenDialog): void {
    if (this.dialog.openDialogs.length > 0) return;
    this.active = open();
    this.active.closed.subscribe(() => (this.active = null));
  }

  private onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.active) this.active.close();
      else this.openPalette();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target) || this.dialog.openDialogs.length > 0) return;
    if (this.popover.openKey() !== null) return;
    if (this.awaitingSecondKey) {
      this.finishSequence();
      const route = GO_ROUTES[event.key.toLowerCase()];
      if (route) {
        event.preventDefault();
        void this.router.navigateByUrl(route);
      }
      return;
    }
    if (event.key === 'g') {
      this.awaitingSecondKey = true;
      this.sequenceTimer = setTimeout(() => this.finishSequence(), SEQUENCE_TIMEOUT_MS);
    } else if (event.key === '?') {
      event.preventDefault();
      this.openHelp();
    } else if (event.key === '/') {
      const search = this.document.querySelector<HTMLInputElement>('[data-global-search]');
      if (search && search.offsetParent !== null) {
        event.preventDefault();
        search.focus();
      }
    }
  }

  private finishSequence(): void {
    this.awaitingSecondKey = false;
    clearTimeout(this.sequenceTimer);
  }
}
