import { Injectable, signal } from '@angular/core';

export type PanelKey = 'notifications' | 'profile' | 'more' | 'menu';

/** Qual gaveta do shell está aberta (notificações, perfil, "Mais" e o menu do celular). */
@Injectable({ providedIn: 'root' })
export class ShellPanels {
  private readonly key = signal<PanelKey | null>(null);
  readonly openKey = this.key.asReadonly();

  toggle(key: PanelKey): void {
    this.key.update((current) => (current === key ? null : key));
  }

  open(key: PanelKey): void {
    this.key.set(key);
  }

  close(): void {
    this.key.set(null);
  }
}
