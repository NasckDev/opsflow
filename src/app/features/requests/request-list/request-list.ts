import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  Observable,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { RequestFilter } from '../../../core/api/mock-database';
import { RequestsApi } from '../../../core/api/requests.api';
import { LocalDatePipe, MoneyPipe } from '../../../core/i18n/format.pipes';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { SessionStore } from '../../../core/session/session.store';
import { REQUEST_STATUSES, RequestStatus, WorkflowRequest } from '../../../domain/request.model';
import { SlaBadge, StatusBadge } from '../../../shared/badges';

export const SEARCH_DEBOUNCE_MS = 300;

export type ListState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error' }
  | { readonly kind: 'loaded'; readonly items: readonly WorkflowRequest[] };

const LOADING: ListState = { kind: 'loading' };

@Component({
  selector: 'app-request-list',
  imports: [RouterLink, TranslatePipe, LocalDatePipe, MoneyPipe, StatusBadge, SlaBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-list.html',
  styleUrl: './request-list.scss',
})
export class RequestList {
  private readonly api = inject(RequestsApi);
  protected readonly session = inject(SessionStore);
  protected readonly statuses = REQUEST_STATUSES;

  protected readonly query = signal('');
  protected readonly status = signal<RequestStatus | ''>('');
  private readonly reloads = signal(0);

  protected readonly state = toSignal(this.loadOnFilterChange(), { initialValue: LOADING });

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as RequestStatus | '');
  }

  protected retry(): void {
    this.reloads.update((count) => count + 1);
  }

  /**
   * Busca com debounce e cancelamento: switchMap descarta respostas antigas
   * quando o usuário continua digitando ou troca o filtro.
   */
  private loadOnFilterChange(): Observable<ListState> {
    const query$ = toObservable(this.query).pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      map((value) => value.trim()),
      distinctUntilChanged(),
    );
    return combineLatest([query$, toObservable(this.status), toObservable(this.reloads)]).pipe(
      switchMap(([query, status]) => this.fetch({ query, status })),
    );
  }

  private fetch(filter: RequestFilter): Observable<ListState> {
    return this.api.list(filter).pipe(
      map((items): ListState => ({ kind: 'loaded', items })),
      startWith(LOADING),
      catchError(() => of<ListState>({ kind: 'error' })),
    );
  }
}
