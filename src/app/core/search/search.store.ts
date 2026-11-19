import { Injectable, signal } from '@angular/core';

/** Busca global: a barra do topo e a lista de solicitações compartilham o mesmo termo. */
@Injectable({ providedIn: 'root' })
export class SearchStore {
  private readonly term = signal('');
  readonly query = this.term.asReadonly();

  set(value: string): void {
    this.term.set(value);
  }

  clear(): void {
    this.term.set('');
  }
}
