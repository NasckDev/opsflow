import { DOCUMENT } from '@angular/common';
import { Injectable, InjectionToken, inject, signal } from '@angular/core';

export type UiThemeMode = 'light' | 'dark';
export type UiDensity = 'compact' | 'comfortable';

/** Prefixo das chaves de armazenamento local (tema e densidade). */
export const UI_STORAGE_PREFIX = new InjectionToken<string>('UI_STORAGE_PREFIX', {
  providedIn: 'root',
  factory: () => 'opsflow',
});

function read(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Preferência opcional: sem armazenamento o app segue com os padrões.
  }
}

/**
 * Tema central do app: modo claro/escuro e densidade. É a única fonte da verdade:
 * os wrappers leem estes signals, e as duas folhas de estilo do NG-ZORRO (clara e
 * escura) são alternadas aqui.
 */
@Injectable({ providedIn: 'root' })
export class UiTheme {
  private readonly document = inject(DOCUMENT);
  private readonly prefix = inject(UI_STORAGE_PREFIX);
  private readonly modeSignal = signal<UiThemeMode>(this.initialMode());
  private readonly densitySignal = signal<UiDensity>(this.initialDensity());

  readonly mode = this.modeSignal.asReadonly();
  readonly density = this.densitySignal.asReadonly();

  constructor() {
    this.apply(this.modeSignal(), this.densitySignal());
  }

  toggle(): void {
    this.setMode(this.modeSignal() === 'dark' ? 'light' : 'dark');
  }

  setMode(mode: UiThemeMode): void {
    this.modeSignal.set(mode);
    write(`${this.prefix}.theme`, mode);
    this.apply(mode, this.densitySignal());
  }

  setDensity(density: UiDensity): void {
    this.densitySignal.set(density);
    write(`${this.prefix}.density`, density);
    this.apply(this.modeSignal(), density);
  }

  /** Aplicado de forma síncrona: gráficos e wrappers leem as cores logo depois. */
  private apply(mode: UiThemeMode, density: UiDensity): void {
    const root = this.document.documentElement;
    root.dataset['theme'] = mode;
    root.dataset['density'] = density;
    // As duas folhas do NG-ZORRO vêm no index.html; só a do modo ativo vale.
    this.document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((link) => {
      if (link.href.includes('theme-dark')) link.media = mode === 'dark' ? 'all' : 'not all';
      else if (link.href.includes('theme-light')) link.media = mode === 'light' ? 'all' : 'not all';
    });
  }

  private initialMode(): UiThemeMode {
    const stored = read(`${this.prefix}.theme`);
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    return prefersDark ? 'dark' : 'light';
  }

  private initialDensity(): UiDensity {
    return read(`${this.prefix}.density`) === 'comfortable' ? 'comfortable' : 'compact';
  }
}
