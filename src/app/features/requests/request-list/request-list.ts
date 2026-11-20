import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { TranslationService } from '../../../core/i18n/translation.service';
import { TranslationKey } from '../../../core/i18n/translations';
import { ToastService } from '../../../core/ui/toast.service';
import { requestsToCsv } from '../../../domain/export';
import { SearchStore } from '../../../core/search/search.store';
import { SessionStore } from '../../../core/session/session.store';
import { REQUEST_STATUSES, RequestStatus, WorkflowRequest } from '../../../domain/request.model';
import { PriorityBadge, SlaMeter, StatusBadge } from '../../../shared/badges';
import { ViewportService } from '../../../core/ui/viewport.service';
import {
  AppAvatar,
  AppButton,
  AppCard,
  AppEmpty,
  AppInput,
  AppList,
  AppPageHeader,
  AppResult,
  AppSkeleton,
  AppTable,
  AppTableCell,
  AppTableColumn,
  AppTableSort,
  AppTag,
} from '../../../ui';
import { SortKey, SortState, countByStatus, sortRequests } from './request-sort';

export const SEARCH_DEBOUNCE_MS = 300;
const CARD_PAGE_SIZE = 15;
const SKELETON_ROWS = [0, 1, 2, 3, 4, 5] as const;

export type ListState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error' }
  | { readonly kind: 'loaded'; readonly items: readonly WorkflowRequest[] };

const LOADING: ListState = { kind: 'loading' };

interface Column {
  readonly key: SortKey;
  readonly label: TranslationKey;
  readonly align?: 'right';
}

const COLUMNS: readonly Column[] = [
  { key: 'code', label: 'list.col.code' },
  { key: 'title', label: 'list.col.title' },
  { key: 'requester', label: 'list.col.requester' },
  { key: 'status', label: 'list.col.status' },
  { key: 'priority', label: 'list.col.priority' },
  { key: 'amount', label: 'list.col.amount', align: 'right' },
  { key: 'dueAt', label: 'list.col.sla' },
];

@Component({
  selector: 'app-request-list',
  imports: [
    FormsModule,
    TranslatePipe,
    MoneyPipe,
    StatusBadge,
    PriorityBadge,
    SlaMeter,
    AppAvatar,
    AppButton,
    AppCard,
    AppEmpty,
    AppInput,
    AppList,
    AppPageHeader,
    AppResult,
    AppSkeleton,
    AppTable,
    AppTableCell,
    AppTag,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-list.html',
  styleUrl: './request-list.scss',
})
export class RequestList {
  private readonly api = inject(RequestsApi);
  protected readonly session = inject(SessionStore);
  protected readonly search = inject(SearchStore);
  private readonly i18n = inject(TranslationService);
  private readonly toast = inject(ToastService);
  protected readonly statuses = REQUEST_STATUSES;
  protected readonly viewport = inject(ViewportService);
  protected readonly columns = computed<AppTableColumn[]>(() => {
    this.i18n.locale();
    return COLUMNS.map((column) => ({
      key: column.key,
      title: this.i18n.translateDynamic(column.label),
      align: column.align,
      sortable: true,
    }));
  });
  protected readonly tableSort = computed<AppTableSort | null>(() => {
    const current = this.sort();
    return current ? { key: current.key, direction: current.direction } : null;
  });
  protected readonly skeletonRows = SKELETON_ROWS;

  protected readonly status = signal<RequestStatus | ''>('');
  protected readonly sort = signal<SortState | null>(null);
  /** No celular a lista de cartões vem aos poucos ( "mostrar mais" ), não em 8 mil pixels. */
  protected readonly cardLimit = signal(CARD_PAGE_SIZE);
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

  protected readonly cards = computed(() => this.visible().slice(0, this.cardLimit()));
  protected readonly moreCards = computed(() => Math.max(0, this.visible().length - this.cardLimit()));

  protected readonly hasFilters = computed(
    () => this.status() !== '' || this.search.query() !== '',
  );

  protected onQuery(value: string | number | null): void {
    this.search.set(String(value ?? ''));
  }

  protected showMore(): void {
    this.cardLimit.update((limit) => limit + CARD_PAGE_SIZE);
  }

  protected setStatus(status: RequestStatus | ''): void {
    this.cardLimit.set(CARD_PAGE_SIZE);
    this.status.set(status);
  }

  private readonly router = inject(Router);

  protected goNew(): void {
    void this.router.navigateByUrl('/requests/new');
  }

  protected onSort(event: AppTableSort): void {
    this.sort.set(
      event.direction ? { key: event.key as SortKey, direction: event.direction } : null,
    );
  }

  protected totalLabel = (total: number): string =>
    this.i18n.translateDynamic('list.count', { count: total });

  protected readonly sortLabel = computed(() => {
    this.i18n.locale();
    return this.i18n.translateDynamic('list.sortBy', { column: '' }).trim();
  });

  /** Baixa a lista que está na tela (já filtrada e ordenada) como CSV para planilha. */
  protected exportCsv(): void {
    const t = (key: string) => this.i18n.translateDynamic(key);
    const csv = requestsToCsv(this.visible(), {
      headers: [
        t('list.col.code'),
        t('list.col.title'),
        t('list.col.requester'),
        t('list.col.status'),
        t('list.col.priority'),
        t('wizard.field.category'),
        t('list.col.amount'),
        t('list.due'),
      ],
      status: (value) => t(`status.${value}`),
      priority: (value) => t(`priority.${value}`),
      category: (value) => t(`category.${value}`),
    });
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'opsflow-solicitacoes.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.toast.show(t('list.exported'), 'success');
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
    // Trocar de papel muda o que o servidor devolve (visibilidade e auditoria): busca de novo.
    return combineLatest([query$, toObservable(this.reloads), toObservable(this.session.currentRole)]).pipe(
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
