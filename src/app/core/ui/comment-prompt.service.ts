import { Injectable, signal } from '@angular/core';
import { WorkflowAction } from '../../domain/request.model';

export interface CommentPromptData {
  readonly action: WorkflowAction;
  readonly code: string;
  /** Aprovar fora do SLA pede justificativa em vez de comentário. */
  readonly justification: boolean;
  /** Quanto tempo o item está atrasado (ex.: "1d 20h"), quando o SLA estourou. */
  readonly overdue: string | null;
}

interface OpenPrompt {
  readonly data: CommentPromptData;
  readonly resolve: (value: string | undefined) => void;
}

/** Fila de um pedido de comentário por vez: a tela só desenha, quem pede espera a resposta. */
@Injectable({ providedIn: 'root' })
export class CommentPromptService {
  private readonly current = signal<OpenPrompt | null>(null);
  readonly open = this.current.asReadonly();

  ask(data: CommentPromptData): Promise<string | undefined> {
    return new Promise((resolve) => this.current.set({ data, resolve }));
  }

  answer(value: string | undefined): void {
    const prompt = this.current();
    this.current.set(null);
    prompt?.resolve(value);
  }
}
