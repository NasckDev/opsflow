import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { RequestsApi } from '../../../core/api/requests.api';
import { MoneyPipe } from '../../../core/i18n/format.pipes';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationKey } from '../../../core/i18n/translations';
import { SearchStore } from '../../../core/search/search.store';
import { SessionStore } from '../../../core/session/session.store';
import { REQUEST_STATUSES, RequestStatus, WorkflowRequest } from '../../../domain/request.model';
import { Avatar } from '../../../shared/avatar';
import { PriorityBadge, SlaMeter, StatusBadge } from '../../../shared/badges';
import { Icon } from '../../../shared/icon';
import { SortKey, SortState, countByStatus, nextSort, sortRequests } from './request-sort';

export const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_ROWS = [0, 1, 2, 3, 4, 5] as const;

export type ListState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error' }
  | { readonly kind: 'loaded'; readonly items: readonly WorkflowRequest[] };

const LOADING: ListState = { kind: 'loading' };

interface Column {
  readonly key: SortKey;
  readonly label: TranslationKey;
  readonly align?: 'end';
}

const COLUMNS: readonly Column[] = [
  { key: 'code', label: 'list.col.code' },
  { key: 'title', label: 'list.col.title' },
  { key: 'requester', label: 'list.col.requester' },
  { key: 'status', label: 'list.col.status' },
  { key: 'priority', label: 'list.col.priority' },
  { key: 'amount', label: 'list.col.amount', align: 'end' },
  { key: 'dueAt', label: 'list.col.sla' },
];

@Component({
  selector: 'app-request-list',
  imports: [
    RouterLink,
    TranslatePipe,
    MoneyPipe,
    StatusBadge,
    PriorityBadge,
    SlaMeter,
    Avatar,
    Icon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-list.html',
  styleUrl: './request-list.scss',
})
export class RequestList {
  private readonly api = inject(RequestsApi);
  protected readonly session = inject(SessionStore);
  protected readonly search = inject(SearchStore);
  protected readonly statuses = REQUEST_STATUSES;
  protected readonly columns = COLUMNS;
  protected readonly skeletonRows = SKELETON_ROWS;

  protected readonly status = signal<RequestStatus | ''>('');
  protected readonly sort = signal<SortState | null>(null);
  private readonly reloads = signal(0);

  /** A API é consultada só pelo termo: os contadores por status precisam do conjunto completo. */
  protected readonly state = toSignal(this.loadOnQueryChange(), { initialValue: LOADING });

  protected readonly counts = computed(() => {
    const current = this.state();
    return countByStatus(current.kind === 'loaded' ? current.items : []);
  });

  protected readonly visible = computed(() => {
    const current = this.state();
    if (current.kind !== 'loaded') return [];
    const status = this.status();
    const filtered = status
      ? current.items.filter((item) => item.status === status)
      : current.items;
    return sortRequests(filtered, this.sort());
  });

  protected readonly hasFilters = computed(
    () => this.status() !== '' || this.search.query() !== '',
  );

  protected onQuery(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected setStatus(status: RequestStatus | ''): void {
    this.status.set(status);
  }

  protected onSort(key: SortKey): void {
    this.sort.update((current) => nextSort(current, key));
  }

  protected ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    const current = this.sort();
    if (current?.key !== key) return 'none';
    return current.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIcon(key: SortKey): 'sortAsc' | 'sortDesc' | 'sortNone' {
    const current = this.sort();
    if (current?.key !== key) return 'sortNone';
    return current.direction === 'asc' ? 'sortAsc' : 'sortDesc';
  }

  protected clearFilters(): void {
    this.status.set('');
    this.search.clear();
  }

  protected retry(): void {
    this.reloads.update((count) => count + 1);
  }

  /**
   * Busca com debounce e cancelamento: switchMap descarta respostas antigas
   * quando o usuário continua digitando.
   */
  private loadOnQueryChange(): Observable<ListState> {
    const query$ = toObservable(this.search.query).pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      map((value) => value.trim()),
      distinctUntilChanged(),
    );
    return combineLatest([query$, toObservable(this.reloads)]).pipe(
      switchMap(([query]) => this.fetch(query)),
    );
  }

  private fetch(query: string): Observable<ListState> {
    return this.api.list({ query }).pipe(
      map((items): ListState => ({ kind: 'loaded', items })),
      startWith(LOADING),
      catchError(() => of<ListState>({ kind: 'error' })),
    );
  }
}
