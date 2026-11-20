import { Injectable, signal } from '@angular/core';

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
  private readonly list = signal<readonly Toast[]>([]);
  readonly toasts = this.list.asReadonly();

  /** Mostra um aviso e devolve o id (para fechá-lo antes da hora). */
  show(message: string, kind: ToastKind = 'success', action?: ToastAction): number {
    this.sequence += 1;
    const toast: Toast = { id: this.sequence, kind, message, action };
    this.list.update((current) => [...current, toast].slice(-MAX_TOASTS));
    setTimeout(() => this.dismiss(toast.id), action ? ACTION_TOAST_DURATION_MS : TOAST_DURATION_MS);
    return toast.id;
  }

  dismiss(id: number): void {
    this.list.update((current) => current.filter((toast) => toast.id !== id));
  }
}
