import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkflowAction } from '../../domain/request.model';
import { AppAlert, AppButton, AppFormItem, AppInput, AppModal } from '../../ui';
import { TranslatePipe } from '../i18n/translate.pipe';

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

/** Pede o comentário obrigatório antes de devolver, rejeitar ou aprovar fora do SLA. */
@Component({
  selector: 'app-comment-prompt',
  imports: [FormsModule, AppModal, AppButton, AppFormItem, AppInput, AppAlert, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (prompt.open(); as current) {
      <app-modal
        [open]="true"
        [title]="('action.' + current.data.action | t) + ' · ' + current.data.code"
        [footer]="true"
        [width]="480"
        [autofocus]="null"
        (closed)="cancel()"
      >
        @if (current.data.overdue) {
          <app-alert
            type="error"
            [message]="'prompt.overdue' | t: { time: current.data.overdue }"
            [showIcon]="true"
          />
          <div class="gap"></div>
        }
        <app-form-item
          forId="prompt-comment"
          [label]="(current.data.justification ? 'prompt.justification' : 'detail.comment') | t"
          [hint]="'prompt.hint' | t"
          [error]="
            error()
              ? ((current.data.justification
                  ? 'error.justification_required'
                  : 'error.comment_required'
                ) | t)
              : null
          "
          [required]="true"
        >
          <app-input
            type="textarea"
            inputId="prompt-comment"
            [rows]="4"
            [invalid]="error()"
            [describedBy]="error() ? 'prompt-comment-error' : 'prompt-comment-hint'"
            (keydown.control.enter)="confirm()"
            [ngModel]="text()"
            (ngModelChange)="onText($event)"
          />
        </app-form-item>
        <div appModalFooter class="actions">
          <app-button (click)="cancel()">{{ 'wizard.cancel' | t }}</app-button>
          <app-button variant="primary" icon="check" (click)="confirm()">
            {{
              (current.data.justification ? 'prompt.approveWithJustification' : 'prompt.confirm')
                | t
            }}
          </app-button>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .gap {
      height: 0.75rem;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `,
})
export class CommentPromptHost {
  protected readonly prompt = inject(CommentPromptService);
  protected readonly text = signal('');
  protected readonly error = signal(false);

  constructor() {
    // Foco no campo do comentário ao abrir (depois da animação do modal).
    effect(() => {
      if (this.prompt.open()) {
        setTimeout(() => document.getElementById('prompt-comment')?.focus(), 200);
      }
    });
  }

  protected onText(value: string): void {
    this.text.set(value);
    this.error.set(false);
  }

  protected confirm(): void {
    const value = this.text().trim();
    if (!value) {
      this.error.set(true);
      return;
    }
    this.reset();
    this.prompt.answer(value);
  }

  protected cancel(): void {
    this.reset();
    this.prompt.answer(undefined);
  }

  private reset(): void {
    this.text.set('');
    this.error.set(false);
  }
}
