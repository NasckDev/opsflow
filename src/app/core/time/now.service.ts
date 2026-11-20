import { Injectable, signal } from '@angular/core';

const TICK_MS = 30_000;

/** Relógio compartilhado: contagens regressivas de SLA se atualizam sem timers por componente. */
@Injectable({ providedIn: 'root' })
export class NowService {
  private readonly current = signal(new Date());
  readonly now = this.current.asReadonly();

  constructor() {
    setInterval(() => this.current.set(new Date()), TICK_MS);
  }
}
