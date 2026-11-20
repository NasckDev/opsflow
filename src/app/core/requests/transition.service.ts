import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Actor, WorkflowAction, WorkflowRequest } from '../../domain/request.model';
import { evaluateSla, formatHours } from '../../domain/sla';
import { accessError, applyTransition, requiresComment } from '../../domain/workflow-machine';
import { RequestsApi, apiErrorCode } from '../api/requests.api';
import { TranslationService } from '../i18n/translation.service';
import { SessionStore } from '../session/session.store';
import { CommentPromptData, CommentPromptService } from '../ui/comment-prompt.service';
import { ToastService } from '../ui/toast.service';
import { RequestsStore } from './requests.store';

/** Janela em que uma decisão ainda pode ser desfeita, antes de ser confirmada na API. */
export const UNDO_WINDOW_MS = 6000;

/** Erros que significam "a tela está velha": recarregamos e avisamos. */
const STALE_ERRORS: readonly string[] = ['conflict', 'not_found'];

export interface ActOptions {
  /** Comentário já escrito (dispensa o diálogo). */
  readonly comment?: string;
  /** Não mostra o toast de sucesso (usado pelo lote, que tem o próprio resumo). */
  readonly quiet?: boolean;
  /** Aplica na tela na hora e só confirma na API depois da janela de desfazer. */
  readonly undoable?: boolean;
  /** `false`: se faltar comentário obrigatório, não abre diálogo e devolve o erro (lote). */
  readonly prompt?: boolean;
}

export interface TransitionOutcome {
  readonly request: WorkflowRequest | null;
  /** Código de erro de domínio (ou "network"); null quando deu certo ou foi cancelado. */
  readonly error: string | null;
  readonly cancelled: boolean;
}

interface Pending {
  readonly original: WorkflowRequest;
  readonly action: WorkflowAction;
  readonly comment: string;
  readonly actor: Actor;
  readonly timer: ReturnType<typeof setTimeout>;
  readonly toastId: number;
}

/**
 * Executa uma ação do fluxo a partir de qualquer tela (detalhe, quadro, caixa de
 * entrada): valida a regra no domínio, pede o comentário obrigatório quando
 * preciso, chama a API, atualiza o cache e avisa o usuário. Uma decisão avulsa
 * pode ser desfeita durante alguns segundos porque só é confirmada depois.
 */
@Injectable({ providedIn: 'root' })
export class TransitionService {
  private readonly api = inject(RequestsApi);
  private readonly store = inject(RequestsStore);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly prompt = inject(CommentPromptService);
  private readonly pending = new Map<string, Pending>();

  /** Impedimento de papel, estado, dono ou segregação (o comentário não conta aqui). */
  blocker(request: WorkflowRequest, action: WorkflowAction): string | null {
    return accessError(request, action, this.session.actor());
  }

  async act(
    request: WorkflowRequest,
    action: WorkflowAction,
    options: ActOptions = {},
  ): Promise<TransitionOutcome> {
    await this.flush(request.id);
    const current = this.store.requests().find((item) => item.id === request.id) ?? request;
    const actor = this.session.actor();
    const blocker = accessError(current, action, actor);
    if (blocker) return this.fail(blocker);

    let text = options.comment?.trim() ?? '';
    if (!text && requiresComment(current, action, new Date())) {
      if (options.prompt === false) return this.fail('justification_required', true);
      const answered = await this.askComment(current, action);
      if (answered === undefined) return { request: null, error: null, cancelled: true };
      text = answered;
    }
    return options.undoable
      ? this.applyWithUndo(current, action, text, actor)
      : this.commit(current, action, text, options.quiet ?? false);
  }

  /** Confirma já qualquer decisão que ainda esteja na janela de desfazer desta solicitação. */
  async flush(requestId: string): Promise<void> {
    const entry = this.pending.get(requestId);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(requestId);
    this.toast.dismiss(entry.toastId);
    await this.send(entry);
  }

  private applyWithUndo(
    request: WorkflowRequest,
    action: WorkflowAction,
    comment: string,
    actor: Actor,
  ): TransitionOutcome {
    const optimistic = applyTransition(request, action, { actor, now: new Date(), comment });
    if (!optimistic.ok) return this.fail(optimistic.error);
    this.store.upsert(optimistic.value);

    const message = this.doneMessage(request, action);
    const toastId = this.toast.show(message, 'success', {
      label: this.i18n.translateDynamic('toast.undo'),
      run: () => this.undo(request.id),
    });
    this.announcer.announce(message);
    const timer = setTimeout(() => void this.flush(request.id), UNDO_WINDOW_MS);
    this.pending.set(request.id, { original: request, action, comment, actor, timer, toastId });
    return { request: optimistic.value, error: null, cancelled: false };
  }

  private undo(requestId: string): void {
    const entry = this.pending.get(requestId);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(requestId);
    this.store.upsert(entry.original);
    this.toast.show(
      this.i18n.translateDynamic('toast.undone', { code: entry.original.code }),
      'info',
    );
    this.announcer.announce(
      this.i18n.translateDynamic('toast.undone', { code: entry.original.code }),
    );
  }

  /** Envia a decisão da janela de desfazer; se falhar, devolve a tela ao estado anterior. */
  private async send(entry: Pending): Promise<void> {
    try {
      const updated = await firstValueFrom(
        this.transitionCall(entry.original, entry.action, entry.comment),
      );
      this.store.upsert(updated);
    } catch (error: unknown) {
      this.store.upsert(entry.original);
      this.fail(apiErrorCode(error));
    }
  }

  private async commit(
    request: WorkflowRequest,
    action: WorkflowAction,
    comment: string,
    quiet: boolean,
  ): Promise<TransitionOutcome> {
    try {
      const updated = await firstValueFrom(this.transitionCall(request, action, comment));
      this.store.upsert(updated);
      if (!quiet) {
        const message = this.doneMessage(request, action);
        this.toast.show(message, 'success');
        this.announcer.announce(message);
      }
      return { request: updated, error: null, cancelled: false };
    } catch (error: unknown) {
      return this.fail(apiErrorCode(error), quiet);
    }
  }

  private transitionCall(request: WorkflowRequest, action: WorkflowAction, comment: string) {
    return this.api.transition(request.id, {
      action,
      comment,
      expectedStatus: request.status,
      expectedUpdatedAt: request.updatedAt,
    });
  }

  private doneMessage(request: WorkflowRequest, action: WorkflowAction): string {
    const text = this.i18n.translateDynamic(`action.done.${action}`);
    return `${request.code} ${text}`;
  }

  private async askComment(
    request: WorkflowRequest,
    action: WorkflowAction,
  ): Promise<string | undefined> {
    const sla = evaluateSla(request, new Date());
    const data: CommentPromptData = {
      action,
      code: request.code,
      justification: action === 'approve',
      overdue: sla.state === 'breached' ? formatHours(Math.abs(sla.hoursRemaining)) : null,
    };
    return this.prompt.ask(data);
  }

  /** Mostra o erro; se a tela estava velha, recarrega o cache e explica o que aconteceu. */
  private fail(code: string, silent = false): TransitionOutcome {
    if (STALE_ERRORS.includes(code)) {
      this.store.load(true);
      if (!silent) this.toast.show(this.i18n.translateDynamic('error.stale'), 'info');
    } else if (!silent) {
      const message = this.i18n.translateDynamic(`error.${code}`);
      this.toast.show(message, 'error');
      this.announcer.announce(message, 'assertive');
    }
    return { request: null, error: code, cancelled: false };
  }
}
