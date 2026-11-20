import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ShellPanels } from '../shell/panels';
import { CommentPromptService } from './comment-prompt.service';

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
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly panels = inject(ShellPanels);
  private readonly prompt = inject(CommentPromptService);
  private awaitingSecondKey = false;
  private sequenceTimer: ReturnType<typeof setTimeout> | undefined;

  readonly paletteOpen = signal(false);
  readonly helpOpen = signal(false);

  /** Há um diálogo aberto (paleta, ajuda ou pedido de comentário). */
  readonly dialogOpen = () => this.paletteOpen() || this.helpOpen() || this.prompt.open() !== null;

  start(): void {
    this.document.addEventListener('keydown', (event) => this.onKeydown(event));
  }

  openPalette(): void {
    if (!this.dialogOpen()) this.paletteOpen.set(true);
  }

  openHelp(): void {
    if (!this.dialogOpen()) this.helpOpen.set(true);
  }

  private onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.paletteOpen()) this.paletteOpen.set(false);
      else this.openPalette();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target) || this.dialogOpen()) return;
    if (this.panels.openKey() !== null) return;
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
      const search = this.document.querySelector<HTMLInputElement>('[data-global-search] input');
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
