import { DOCUMENT } from '@angular/common';
import { Injectable, InjectionToken, inject, signal } from '@angular/core';

const LIGHT_LINK_ID = 'ox-theme-light';

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
    // O OpsFlow é escuro por padrão: a folha escura vem no bundle. A clara só é baixada na primeira
    // vez que o tema claro é usado (carrega depois da escura e a sobrepõe); voltar ao escuro a desativa.
    const light = this.document.getElementById(LIGHT_LINK_ID) as HTMLLinkElement | null;
    if (mode === 'light') {
      if (light) light.disabled = false;
      else this.insertLight(this.lightLink());
    } else if (light) {
      light.disabled = true;
    }
  }

  /**
   * A folha clara entra logo depois da escura do NG-ZORRO (para sobrepô-la) e antes dos estilos
   * do app, que ajustam o NG-ZORRO com a mesma especificidade e precisam vir por último.
   */
  private insertLight(link: HTMLLinkElement): void {
    const base = this.document.querySelector('link[href*="theme-dark"]');
    if (base) base.after(link);
    else this.document.head.appendChild(link);
  }

  private lightLink(): HTMLLinkElement {
    const link = this.document.createElement('link');
    link.id = LIGHT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = new URL('theme-light.css', this.document.baseURI).href;
    return link;
  }

  /** Escuro por padrão (identidade "torre de controle"); o claro só por escolha salva. */
  private initialMode(): UiThemeMode {
    return read(`${this.prefix}.theme`) === 'light' ? 'light' : 'dark';
  }

  private initialDensity(): UiDensity {
    return read(`${this.prefix}.density`) === 'comfortable' ? 'comfortable' : 'compact';
  }
}
