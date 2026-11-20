import { Injectable, computed, inject, signal } from '@angular/core';
import { WorkflowRequest } from '../../domain/request.model';
import { RequestsApi } from '../api/requests.api';

export type StoreStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Cache compartilhado das solicitações: caixa de entrada, quadro, análises,
 * notificações e paleta de comandos leem do mesmo lugar e se atualizam juntos.
 */
@Injectable({ providedIn: 'root' })
export class RequestsStore {
  private readonly api = inject(RequestsApi);
  private readonly items = signal<readonly WorkflowRequest[]>([]);
  private readonly state = signal<StoreStatus>('idle');

  readonly requests = this.items.asReadonly();
  readonly status = this.state.asReadonly();
  readonly loaded = computed(() => this.state() === 'loaded');

  /** Carrega uma vez; `force` refaz a busca (tentar de novo, atualizar). */
  load(force = false): void {
    if (this.state() === 'loading' || (this.state() === 'loaded' && !force)) return;
    this.state.set('loading');
    this.api.list({}).subscribe({
      next: (requests) => {
        this.items.set(requests);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
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
