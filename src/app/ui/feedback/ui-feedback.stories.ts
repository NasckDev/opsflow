import { Component, inject, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppButton } from '../button/app-button';
import { UiFeedback, UiFeedbackHost, UiFeedbackKind } from './ui-feedback';

/** Demonstra os avisos (NzMessage) com ação opcional de desfazer. */
@Component({
  selector: 'app-feedback-demo',
  imports: [AppButton, UiFeedbackHost],
  template: `
    <app-feedback-host />
    <app-button variant="primary" (click)="show()">Mostrar aviso</app-button>
  `,
})
class FeedbackDemo {
  private readonly feedback = inject(UiFeedback);
  readonly kind = input<UiFeedbackKind>('success');
  readonly text = input('REQ-2041 aprovada.');
  readonly withAction = input(true);

  show(): void {
    this.feedback.show(
      this.text(),
      this.kind(),
      6000,
      this.withAction() ? { label: 'Desfazer', run: () => undefined } : undefined,
    );
  }
}

const meta: Meta<FeedbackDemo> = {
  title: 'UI/Feedback (avisos)',
  component: FeedbackDemo,
  argTypes: { kind: { control: 'select', options: ['success', 'error', 'info', 'warning'] } },
};
export default meta;
type Story = StoryObj<FeedbackDemo>;

export const ComDesfazer: Story = {};
export const Erro: Story = {
  args: { kind: 'error', text: 'Não foi possível salvar. Tente novamente.', withAction: false },
};
export const Informacao: Story = {
  args: { kind: 'info', text: 'A solicitação foi atualizada por outra pessoa.', withAction: false },
};
