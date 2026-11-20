import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
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
import { AuditAction, WorkflowAction, WorkflowRequest } from '../../../domain/request.model';
import { availableActions } from '../../../domain/workflow-machine';
import { ApprovalChain } from '../../../shared/approval-chain';
import { Avatar } from '../../../shared/avatar';
import { PriorityBadge, SlaMeter, StatusBadge } from '../../../shared/badges';
import { Icon, IconName } from '../../../shared/icon';

type DetailState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'error' }
  | { readonly kind: 'loaded'; readonly request: WorkflowRequest };

const LOADING: DetailState = { kind: 'loading' };

export const ACTION_ICONS: Readonly<Record<AuditAction, IconName>> = {
  create: 'plusCircle',
  migrate: 'history',
  submit: 'send',
  resubmit: 'send',
  return: 'undo',
  approve: 'checkCircle',
  reject: 'xCircle',
  complete: 'check',
};

const BUTTON_CLASSES: Readonly<Record<WorkflowAction, string>> = {
  submit: 'btn-primary',
  resubmit: 'btn-primary',
  complete: 'btn-primary',
  approve: 'btn-success',
  reject: 'btn-danger',
  return: '',
};

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
  protected readonly session = inject(SessionStore);

  /** Vem do parâmetro de rota `:id` (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly reloads = signal(0);
  /** Versão atualizada após uma transição ou anexo, sem recarregar. */
  private readonly updated = signal<WorkflowRequest | null>(null);
  private readonly loaded = toSignal(this.loadRequest(), { initialValue: LOADING });
  private readonly fetchedComments = toSignal(this.loadComments(), {
    initialValue: [] as readonly RequestComment[],
  });
  private readonly posted = signal<readonly RequestComment[]>([]);

  protected readonly actionIcons = ACTION_ICONS;
  protected readonly busy = signal(false);
  protected readonly draftComment = signal('');
  protected readonly commentError = signal<string | null>(null);
  protected readonly posting = signal(false);

  protected readonly state = computed<DetailState>(() => {
    const fresh = this.updated();
    const current = this.loaded();
    return fresh && current.kind === 'loaded' ? { kind: 'loaded', request: fresh } : current;
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
  protected readonly canAttach = computed(() => this.session.currentRole() !== 'auditor');

  protected buttonClass(action: WorkflowAction): string {
    return BUTTON_CLASSES[action];
  }

  protected retry(): void {
    this.reloads.update((count) => count + 1);
  }

  protected async run(request: WorkflowRequest, action: WorkflowAction): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const outcome = await this.transitions.act(request, action);
      if (outcome.request) this.updated.set(outcome.request);
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
      .addComment(request.id, { actor: this.session.actor(), body: this.draftComment() })
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
    const input = event.target as HTMLInputElement;
    const names = Array.from(input.files ?? []).map((file) => file.name);
    input.value = '';
    names.forEach((name) => this.attach(request.id, name));
  }

  private attach(requestId: string, name: string): void {
    this.api.addDocument(requestId, { name }).subscribe({
      next: (request) => {
        this.updated.set(request);
        this.store.upsert(request);
        this.toast.show(this.i18n.translateDynamic('detail.attached', { name }), 'success');
      },
      error: (failure: unknown) =>
        this.toast.show(this.i18n.translateDynamic(`error.${apiErrorCode(failure)}`), 'error'),
    });
  }

  private loadRequest(): Observable<DetailState> {
    return combineLatest([toObservable(this.id), toObservable(this.reloads)]).pipe(
      switchMap(([id]) => {
        this.updated.set(null);
        return this.api.get(id).pipe(
          map((request): DetailState => ({ kind: 'loaded', request })),
          startWith(LOADING),
          catchError((error: unknown) =>
            of<DetailState>({ kind: apiErrorCode(error) === 'not_found' ? 'not_found' : 'error' }),
          ),
        );
      }),
    );
  }

  private loadComments(): Observable<readonly RequestComment[]> {
    return combineLatest([toObservable(this.id), toObservable(this.reloads)]).pipe(
      tap(() => this.posted.set([])),
      switchMap(([id]) =>
        this.api.comments(id).pipe(catchError(() => of<readonly RequestComment[]>([]))),
      ),
    );
  }
}
