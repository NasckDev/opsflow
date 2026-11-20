import { CdkTrapFocus } from '@angular/cdk/a11y';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { WorkflowAction } from '../../domain/request.model';
import { Icon } from '../../shared/icon';
import { TranslatePipe } from '../i18n/translate.pipe';

export interface CommentPromptData {
  readonly action: WorkflowAction;
  readonly code: string;
  /** Aprovar fora do SLA pede justificativa em vez de comentário. */
  readonly justification: boolean;
  /** Quanto tempo o item está atrasado (ex.: "1d 20h"), quando o SLA estourou. */
  readonly overdue: string | null;
}

/** Pede o comentário obrigatório antes de devolver, rejeitar ou aprovar fora do SLA. */
@Component({
  selector: 'app-comment-prompt',
  imports: [CdkTrapFocus, TranslatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .overdue {
      margin: 0;
      padding: var(--ox-space-3);
      color: var(--ox-color-danger);
      background: var(--ox-color-danger-surface);
      border-radius: var(--ox-radius-md);
      line-height: 1.45;
    }
  `,
  template: `
    <form
      class="dialog-card"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
      (submit)="$event.preventDefault(); confirm()"
    >
      <h2 id="prompt-title">
        {{ 'action.' + data.action | t }} · <span class="mono">{{ data.code }}</span>
      </h2>
      @if (data.overdue) {
        <p class="overdue" role="note">{{ 'prompt.overdue' | t: { time: data.overdue } }}</p>
      }
      <div class="field">
        <label for="prompt-comment">
          {{ (data.justification ? 'prompt.justification' : 'detail.comment') | t }}
        </label>
        <textarea
          id="prompt-comment"
          rows="4"
          [value]="text()"
          (input)="onInput($event)"
          [attr.aria-invalid]="error() ? 'true' : null"
          aria-describedby="prompt-hint"
        ></textarea>
        <p id="prompt-hint" class="hint">{{ 'prompt.hint' | t }}</p>
        @if (error()) {
          <p class="field-error" role="alert">
            {{
              (data.justification ? 'error.justification_required' : 'error.comment_required') | t
            }}
          </p>
        }
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn" (click)="ref.close()">{{ 'wizard.cancel' | t }}</button>
        <button type="submit" class="btn btn-primary">
          <app-icon name="check" />{{ (data.justification ? 'prompt.approveWithJustification' : 'prompt.confirm') | t }}
        </button>
      </div>
    </form>
  `,
})
export class CommentPrompt {
  protected readonly data = inject<CommentPromptData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  protected readonly text = signal('');
  protected readonly error = signal(false);

  protected onInput(event: Event): void {
    this.text.set((event.target as HTMLTextAreaElement).value);
    this.error.set(false);
  }

  protected confirm(): void {
    const value = this.text().trim();
    if (!value) {
      this.error.set(true);
      return;
    }
    this.ref.close(value);
  }
}
