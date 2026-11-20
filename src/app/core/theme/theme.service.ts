import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { readStorage, writeStorage } from '../storage';

export type Theme = 'light' | 'dark';
export type Density = 'compact' | 'comfortable';

const THEME_KEY = 'opsflow.theme';
const DENSITY_KEY = 'opsflow.density';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Theme>(this.initialTheme());
  private readonly currentDensity = signal<Density>(this.initialDensity());

  readonly theme = this.current.asReadonly();
  readonly density = this.currentDensity.asReadonly();

  constructor() {
    effect(() => {
      const theme = this.current();
      this.document.documentElement.dataset['theme'] = theme;
      writeStorage(THEME_KEY, theme);
    });
    effect(() => {
      const density = this.currentDensity();
      this.document.documentElement.dataset['density'] = density;
      writeStorage(DENSITY_KEY, density);
    });
  }

  toggle(): void {
    this.current.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  setDensity(density: Density): void {
    this.currentDensity.set(density);
  }

  private initialTheme(): Theme {
    const stored = readStorage(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    return prefersDark ? 'dark' : 'light';
  }

  private initialDensity(): Density {
    return readStorage(DENSITY_KEY) === 'comfortable' ? 'comfortable' : 'compact';
  }
}
