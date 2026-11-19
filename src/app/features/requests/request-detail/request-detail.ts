import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  Observable,
  catchError,
  combineLatest,
  finalize,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { RequestsApi, apiErrorCode } from '../../../core/api/requests.api';
import { LocalDatePipe, MoneyPipe } from '../../../core/i18n/format.pipes';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';
import { SessionStore } from '../../../core/session/session.store';
import { WorkflowAction, WorkflowRequest } from '../../../domain/request.model';
import { availableActions, checkTransition } from '../../../domain/workflow-machine';
import { SlaBadge, StatusBadge } from '../../../shared/badges';

type DetailState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'error' }
  | { readonly kind: 'loaded'; readonly request: WorkflowRequest };

const LOADING: DetailState = { kind: 'loading' };

@Component({
  selector: 'app-request-detail',
  imports: [RouterLink, TranslatePipe, LocalDatePipe, MoneyPipe, StatusBadge, SlaBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
})
export class RequestDetail {
  private readonly api = inject(RequestsApi);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly i18n = inject(TranslationService);
  protected readonly session = inject(SessionStore);

  /** Vem do parâmetro de rota `:id` (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly reloads = signal(0);
  /** Versão atualizada após uma transição, sem precisar recarregar. */
  private readonly updated = signal<WorkflowRequest | null>(null);
  private readonly loaded = toSignal(this.loadRequest(), { initialValue: LOADING });

  protected readonly comment = signal('');
  protected readonly actionError = signal<string | null>(null);
  protected readonly busy = signal(false);
  private readonly commentField = viewChild<ElementRef<HTMLTextAreaElement>>('commentField');

  protected readonly state = computed<DetailState>(() => {
    const fresh = this.updated();
    const current = this.loaded();
    return fresh && current.kind === 'loaded' ? { kind: 'loaded', request: fresh } : current;
  });

  protected readonly actions = computed<WorkflowAction[]>(() => {
    const state = this.state();
    return state.kind === 'loaded' ? availableActions(state.request, this.session.actor()) : [];
  });

  protected onComment(event: Event): void {
    this.comment.set((event.target as HTMLTextAreaElement).value);
  }

  protected retry(): void {
    this.reloads.update((count) => count + 1);
  }

  protected run(request: WorkflowRequest, action: WorkflowAction): void {
    const context = { actor: this.session.actor(), now: new Date(), comment: this.comment() };
    const localError = checkTransition(request, action, context);
    if (localError) {
      this.fail(localError);
      return;
    }
    this.busy.set(true);
    this.api
      .transition(request.id, {
        action,
        actor: context.actor,
        comment: context.comment,
        expectedStatus: request.status,
      })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (result) => this.succeed(result, action),
        error: (error: unknown) => this.fail(apiErrorCode(error)),
      });
  }

  private succeed(result: WorkflowRequest, action: WorkflowAction): void {
    this.updated.set(result);
    this.comment.set('');
    this.actionError.set(null);
    const label = this.i18n.translateDynamic(`action.${action}`);
    this.announcer.announce(this.i18n.translateDynamic('detail.done', { action: label }));
  }

  private fail(code: string): void {
    const message = this.i18n.translateDynamic(`error.${code}`);
    this.actionError.set(message);
    this.announcer.announce(message, 'assertive');
    if (code === 'comment_required' || code === 'justification_required') {
      this.commentField()?.nativeElement.focus();
    }
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
}
