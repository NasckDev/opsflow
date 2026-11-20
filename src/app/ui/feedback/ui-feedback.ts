import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  afterNextRender,
  TemplateRef,
  inject,
  viewChild,
} from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AppButton } from '../button/app-button';

export type UiFeedbackKind = 'success' | 'error' | 'info' | 'warning';

export interface UiFeedbackAction {
  readonly label: string;
  readonly run: () => void;
}

interface FeedbackData {
  readonly text: string;
  readonly kind: UiFeedbackKind;
  readonly action?: UiFeedbackAction;
  readonly messageId: () => string;
}

/**
 * Avisos do app (NzMessage), com ação opcional (ex.: "Desfazer") e anúncio para leitor de
 * tela. Precisa do `<app-feedback-host />` na raiz, que fornece o modelo visual.
 */
@Injectable({ providedIn: 'root' })
export class UiFeedback {
  private readonly message = inject(NzMessageService);
  private readonly announcer = inject(LiveAnnouncer);
  private template: TemplateRef<{ data: FeedbackData }> | null = null;
  private sequence = 0;
  private readonly ids = new Map<number, string>();

  /** @internal Registrado pelo host. */
  register(template: TemplateRef<{ data: FeedbackData }>): void {
    this.template = template;
  }

  show(text: string, kind: UiFeedbackKind, durationMs: number, action?: UiFeedbackAction): number {
    this.sequence += 1;
    const id = this.sequence;
    this.announcer.announce(text, kind === 'error' ? 'assertive' : 'polite');
    if (!this.template) return id;
    const data: FeedbackData = { text, kind, action, messageId: () => this.ids.get(id) ?? '' };
    const ref = this.message.create(kind, this.template as never, {
      nzDuration: durationMs,
      nzData: data,
    });
    this.ids.set(id, ref.messageId);
    return id;
  }

  dismiss(id: number): void {
    const messageId = this.ids.get(id);
    if (messageId) this.message.remove(messageId);
    this.ids.delete(id);
  }
}

/** Modelo visual dos avisos. Colocar uma vez, na raiz do app. */
@Component({
  selector: 'app-feedback-host',
  imports: [AppButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #tpl let-data="data">
      <span class="app-feedback" [attr.data-kind]="data.kind">
        <span class="app-feedback-text">{{ data.text }}</span>
        @if (data.action; as action) {
          <app-button variant="link" size="small" (click)="run(action, data)">{{
            action.label
          }}</app-button>
        }
      </span>
    </ng-template>
  `,
})
export class UiFeedbackHost {
  private readonly feedback = inject(UiFeedback);
  private readonly message = inject(NzMessageService);
  private readonly tpl = viewChild.required<TemplateRef<{ data: FeedbackData }>>('tpl');

  constructor() {
    afterNextRender(() => this.feedback.register(this.tpl()));
  }


  protected run(action: UiFeedbackAction, data: FeedbackData): void {
    action.run();
    const id = data.messageId();
    if (id) this.message.remove(id);
  }
}
