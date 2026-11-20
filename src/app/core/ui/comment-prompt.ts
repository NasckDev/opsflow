import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppAlert, AppButton, AppFormItem, AppInput, AppModal } from '../../ui';
import { TranslatePipe } from '../i18n/translate.pipe';

import { CommentPromptService } from './comment-prompt.service';

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
