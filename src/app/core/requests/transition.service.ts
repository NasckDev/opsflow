import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Dialog } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslationService } from '../i18n/translation.service';
import { SessionStore } from '../session/session.store';
import { ToastService } from '../ui/toast.service';
import { CommentPrompt, CommentPromptData } from '../ui/comment-prompt';
import { RequestsApi, apiErrorCode } from '../api/requests.api';
import { WorkflowAction, WorkflowRequest } from '../../domain/request.model';
import { checkTransition, requiresComment } from '../../domain/workflow-machine';
import { RequestsStore } from './requests.store';

export interface TransitionOutcome {
  readonly request: WorkflowRequest | null;
  /** Código de erro de domínio (ou "network"); null quando deu certo ou foi cancelado. */
  readonly error: string | null;
  readonly cancelled: boolean;
}

/**
 * Executa uma ação do fluxo a partir de qualquer tela (detalhe, quadro, caixa de
 * entrada): valida a regra localmente, pede o comentário obrigatório quando
 * preciso, chama a API, atualiza o cache e avisa o usuário.
 */
@Injectable({ providedIn: 'root' })
export class TransitionService {
  private readonly api = inject(RequestsApi);
  private readonly store = inject(RequestsStore);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly dialog = inject(Dialog);

  /** Valida sem executar: devolve o código do impedimento (comentário não conta). */
  blocker(request: WorkflowRequest, action: WorkflowAction): string | null {
    const error = checkTransition(request, action, {
      actor: this.session.actor(),
      now: new Date(),
      comment: 'x',
    });
    return error;
  }

  async act(
    request: WorkflowRequest,
    action: WorkflowAction,
    comment?: string,
    quiet = false,
  ): Promise<TransitionOutcome> {
    const actor = this.session.actor();
    const blocker = this.blocker(request, action);
    if (blocker) return this.fail(blocker);

    let text = comment?.trim() ?? '';
    if (!text && requiresComment(request, action, new Date())) {
      const answered = await this.askComment(request, action);
      if (answered === undefined) return { request: null, error: null, cancelled: true };
      text = answered;
    }
    try {
      const updated = await firstValueFrom(
        this.api.transition(request.id, {
          action,
          actor,
          comment: text,
          expectedStatus: request.status,
        }),
      );
      this.store.upsert(updated);
      const label = this.i18n.translateDynamic(`action.${action}`);
      const message = this.i18n.translateDynamic('detail.done', { action: label });
      if (!quiet) this.toast.show(`${request.code}: ${message}`, 'success');
      this.announcer.announce(message);
      return { request: updated, error: null, cancelled: false };
    } catch (error: unknown) {
      return this.fail(apiErrorCode(error));
    }
  }

  private askComment(
    request: WorkflowRequest,
    action: WorkflowAction,
  ): Promise<string | undefined> {
    const data: CommentPromptData = {
      action,
      code: request.code,
      justification: action === 'approve',
    };
    const ref = this.dialog.open<string, CommentPromptData>(CommentPrompt, {
      data,
      ariaModal: true,
      ariaLabelledBy: 'prompt-title',
      panelClass: 'ox-dialog-panel',
      backdropClass: 'ox-dialog-backdrop',
      autoFocus: false,
    });
    return firstValueFrom(ref.closed);
  }

  private fail(code: string): TransitionOutcome {
    const message = this.i18n.translateDynamic(`error.${code}`);
    this.toast.show(message, 'error');
    this.announcer.announce(message, 'assertive');
    return { request: null, error: code, cancelled: false };
  }
}
