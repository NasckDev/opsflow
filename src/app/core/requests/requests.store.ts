import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { WorkflowRequest } from '../../domain/request.model';
import { RequestsApi } from '../api/requests.api';
import { SessionStore } from '../session/session.store';

export type StoreStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Cache compartilhado das solicitações: caixa de entrada, quadro, análises,
 * notificações e paleta leem do mesmo lugar e se atualizam juntos. O servidor
 * filtra e redige os dados por papel, então trocar de papel recarrega tudo.
 */
@Injectable({ providedIn: 'root' })
export class RequestsStore {
  private readonly api = inject(RequestsApi);
  private readonly session = inject(SessionStore);
  private readonly items = signal<readonly WorkflowRequest[]>([]);
  private readonly state = signal<StoreStatus>('idle');
  private lastActorKey: string | null = null;
  private generation = 0;

  readonly requests = this.items.asReadonly();
  readonly status = this.state.asReadonly();
  readonly loaded = computed(() => this.state() === 'loaded');

  constructor() {
    effect(() => {
      const actor = this.session.actor();
      const key = `${actor.role}:${actor.name}`;
      untracked(() => {
        if (this.lastActorKey !== null && this.lastActorKey !== key && this.state() !== 'idle') {
          this.items.set([]);
          this.state.set('loading');
          this.load(true);
        }
        this.lastActorKey = key;
      });
    });
  }

  /** Carrega uma vez; `force` refaz a busca (tentar de novo, atualizar). */
  load(force = false): void {
    if (this.state() === 'loading' && !force) return;
    if (this.state() === 'loaded' && !force) return;
    if (this.state() !== 'loaded') this.state.set('loading');
    const generation = ++this.generation;
    this.api.list({}).subscribe({
      next: (requests) => {
        if (generation !== this.generation) return; // resposta de uma busca já substituída
        this.items.set(requests);
        this.state.set('loaded');
      },
      error: () => {
        if (generation === this.generation) this.state.set('error');
      },
    });
  }

  /** Aplica uma versão nova (após transição, anexo ou criação) sem recarregar tudo. */
  upsert(request: WorkflowRequest): void {
    this.items.update((current) => {
      const exists = current.some((item) => item.id === request.id);
      const next = exists
        ? current.map((item) => (item.id === request.id ? request : item))
        : [request, ...current];
      return [...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
  }
}
