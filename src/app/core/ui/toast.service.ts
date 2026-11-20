import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly message: string;
}

const TOAST_DURATION_MS = 4500;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private sequence = 0;
  private readonly list = signal<readonly Toast[]>([]);
  readonly toasts = this.list.asReadonly();

  show(message: string, kind: ToastKind = 'success'): void {
    this.sequence += 1;
    const toast: Toast = { id: this.sequence, kind, message };
    this.list.update((current) => [...current, toast].slice(-3));
    setTimeout(() => this.dismiss(toast.id), TOAST_DURATION_MS);
  }

  dismiss(id: number): void {
    this.list.update((current) => current.filter((toast) => toast.id !== id));
  }
}
