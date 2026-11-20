import { Injectable, inject, signal } from '@angular/core';
import { UiFeedback } from '../../ui';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastAction {
  readonly label: string;
  readonly run: () => void;
}

export interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly message: string;
  readonly action?: ToastAction;
}

const TOAST_DURATION_MS = 4500;
/** Toast com ação (ex.: desfazer) fica o tempo da janela da ação. */
const ACTION_TOAST_DURATION_MS = 6000;
const MAX_TOASTS = 3;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private sequence = 0;
  private readonly feedback = inject(UiFeedback);
  private readonly feedbackIds = new Map<number, number>();
  private readonly list = signal<readonly Toast[]>([]);
  readonly toasts = this.list.asReadonly();

  /** Mostra um aviso (visual: NzMessage via UiFeedback; o estado fica aqui) e devolve o id (para fechá-lo antes da hora). */
  show(message: string, kind: ToastKind = 'success', action?: ToastAction): number {
    this.sequence += 1;
    const toast: Toast = { id: this.sequence, kind, message, action };
    this.list.update((current) => [...current, toast].slice(-MAX_TOASTS));
    const duration = action ? ACTION_TOAST_DURATION_MS : TOAST_DURATION_MS;
    const feedbackId = this.feedback.show(
      message,
      kind === 'error' ? 'error' : kind === 'info' ? 'info' : 'success',
      duration,
      action,
    );
    this.feedbackIds.set(toast.id, feedbackId);
    setTimeout(() => this.dismiss(toast.id), duration);
    return toast.id;
  }

  dismiss(id: number): void {
    const feedbackId = this.feedbackIds.get(id);
    if (feedbackId !== undefined) this.feedback.dismiss(feedbackId);
    this.feedbackIds.delete(id);
    this.list.update((current) => current.filter((toast) => toast.id !== id));
  }
}
