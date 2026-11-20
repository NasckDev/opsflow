import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, catchError, combineLatest, map, of, startWith, switchMap, tap } from 'rxjs';
import { RequestsApi, apiErrorCode } from '../../../core/api/requests.api';
import { LocalDatePipe, MoneyPipe } from '../../../core/i18n/format.pipes';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';
import { RequestsStore } from '../../../core/requests/requests.store';
import { TransitionService } from '../../../core/requests/transition.service';
import { SessionStore } from '../../../core/session/session.store';
import { ToastService } from '../../../core/ui/toast.service';
import { buildApprovalChain } from '../../../domain/approval-chain';
import { RequestComment, validateCommentBody } from '../../../domain/comments';
import { WorkflowAction, WorkflowRequest } from '../../../domain/request.model';
import { availableActions } from '../../../domain/workflow-machine';
import { ACTION_BUTTON_CLASS, ACTION_ICONS } from '../../../shared/action-meta';
import { ApprovalChain } from '../../../shared/approval-chain';
import { Avatar } from '../../../shared/avatar';
import { PriorityBadge, SlaMeter, StatusBadge } from '../../../shared/badges';
import { Icon } from '../../../shared/icon';

type DetailState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'forbidden' }
  | { readonly kind: 'error' }
  | { readonly kind: 'loaded'; readonly request: WorkflowRequest };

const LOADING: DetailState = { kind: 'loading' };

/** Estados em que ainda dá para anexar arquivos (regra do servidor). */
const ATTACHABLE_STATUSES: readonly WorkflowRequest['status'][] = ['draft', 'returned'];

@Component({
  selector: 'app-request-detail',
  imports: [
    RouterLink,
    TranslatePipe,
    LocalDatePipe,
    MoneyPipe,
    StatusBadge,
    PriorityBadge,
    SlaMeter,
    Avatar,
    ApprovalChain,
    Icon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
})
export class RequestDetail {
  private readonly api = inject(RequestsApi);
  private readonly store = inject(RequestsStore);
  private readonly transitions = inject(TransitionService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly session = inject(SessionStore);

  /** Vem do parâmetro de rota `:id` (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly reloads = signal(0);
  private readonly loaded = toSignal(this.loadRequest(), { initialValue: LOADING });
  private readonly fetchedComments = toSignal(this.loadComments(), {
    initialValue: [] as readonly RequestComment[],
  });
  private readonly posted = signal<readonly RequestComment[]>([]);

  protected readonly actionIcons = ACTION_ICONS;
  protected readonly buttonClass = ACTION_BUTTON_CLASS;
  protected readonly busy = signal(false);
  protected readonly draftComment = signal('');
  protected readonly commentError = signal<string | null>(null);
  protected readonly posting = signal(false);

  /**
   * A versão do cache compartilhado manda quando existe: toda ação (inclusive o
   * desfazer) passa por ele, então o detalhe nunca fica atrás do resto do app.
   */
  protected readonly state = computed<DetailState>(() => {
    const current = this.loaded();
    if (current.kind !== 'loaded') return current;
    const shared = this.store.requests().find((item) => item.id === current.request.id);
    return { kind: 'loaded', request: shared ?? current.request };
  });

  protected readonly actions = computed<WorkflowAction[]>(() => {
    const state = this.state();
    return state.kind === 'loaded' ? availableActions(state.request, this.session.actor()) : [];
  });

  protected readonly chain = computed(() => {
    const state = this.state();
    return state.kind === 'loaded' ? buildApprovalChain(state.request) : [];
  });

  protected readonly thread = computed(() => [...this.fetchedComments(), ...this.posted()]);

  /** Anexar só enquanto é editável (rascunho ou devolvida) e só para o dono ou o administrador. */
  protected canAttach(request: WorkflowRequest): boolean {
    const actor = this.session.actor();
    const isOwner = request.requester === actor.name;
    return (
      ATTACHABLE_STATUSES.includes(request.status) &&
      actor.role !== 'auditor' &&
      (isOwner || actor.role === 'admin')
    );
  }

  protected retry(): void {
    this.reloads.update((count) => count + 1);
  }

  protected async run(request: WorkflowRequest, action: WorkflowAction): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const outcome = await this.transitions.act(request, action, { undoable: true });
      if (outcome.error === 'conflict' || outcome.error === 'not_found') this.retry();
    } finally {
      this.busy.set(false);
    }
  }

  protected onDraft(event: Event): void {
    this.draftComment.set((event.target as HTMLTextAreaElement).value);
    this.commentError.set(null);
  }

  protected postComment(request: WorkflowRequest): void {
    const error = validateCommentBody(this.draftComment());
    if (error) {
      this.commentError.set(error);
      return;
    }
    this.posting.set(true);
    this.api
      .addComment(request.id, { body: this.draftComment() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comment) => {
          this.posted.update((current) => [...current, comment]);
          this.draftComment.set('');
          this.posting.set(false);
        },
        error: (failure: unknown) => {
          this.commentError.set(apiErrorCode(failure));
          this.posting.set(false);
        },
      });
  }

  protected onFiles(request: WorkflowRequest, event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const names = Array.from(input.files ?? []).map((file) => file.name);
    input.value = '';
    names.forEach((name) => this.attach(request.id, name));
  }

  private attach(requestId: string, name: string): void {
    this.api
      .addDocument(requestId, { name })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (request) => {
          this.store.upsert(request);
          this.toast.show(this.i18n.translateDynamic('detail.attached', { name }), 'success');
        },
        error: (failure: unknown) =>
          this.toast.show(this.i18n.translateDynamic(`error.${apiErrorCode(failure)}`), 'error'),
      });
  }

  private loadRequest(): Observable<DetailState> {
    return combineLatest([
      toObservable(this.id),
      toObservable(this.reloads),
      toObservable(this.session.currentRole),
    ]).pipe(
      switchMap(([id]) =>
        this.api.get(id).pipe(
          map((request): DetailState => ({ kind: 'loaded', request })),
          startWith(LOADING),
          catchError((error: unknown) => {
            const code = apiErrorCode(error);
            const kind = code === 'not_found' || code === 'forbidden' ? code : 'error';
            return of<DetailState>({ kind });
          }),
        ),
      ),
    );
  }

  private loadComments(): Observable<readonly RequestComment[]> {
    return combineLatest([
      toObservable(this.id),
      toObservable(this.reloads),
      toObservable(this.session.currentRole),
    ]).pipe(
      tap(() => this.posted.set([])),
      switchMap(([id]) =>
        this.api.comments(id).pipe(catchError(() => of<readonly RequestComment[]>([]))),
      ),
    );
  }
}
