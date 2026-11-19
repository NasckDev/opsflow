import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { readStorage, writeStorage } from '../storage';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'opsflow.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Theme>(this.initialTheme());

  readonly theme = this.current.asReadonly();

  constructor() {
    effect(() => {
      const theme = this.current();
      this.document.documentElement.dataset['theme'] = theme;
      writeStorage(STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this.current.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  private initialTheme(): Theme {
    const stored = readStorage(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    return prefersDark ? 'dark' : 'light';
  }
}
