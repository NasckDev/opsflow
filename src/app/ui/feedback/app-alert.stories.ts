import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppButton } from '../button/app-button';
import { AppAlert } from './app-alert';

const meta: Meta<AppAlert> = {
  title: 'UI/Alert',
  component: AppAlert,
  decorators: [moduleMetadata({ imports: [AppAlert, AppButton] })],
  args: { type: 'info', message: 'Rascunho recuperado.', description: '', showIcon: true, closable: false },
  argTypes: { type: { control: 'select', options: ['success', 'info', 'warning', 'error'] } },
};
export default meta;
type Story = StoryObj<AppAlert>;

export const Informacao: Story = {
};

export const Sucesso: Story = {
  args: { type: 'success', message: 'Solicitação aprovada.' },
};

export const Aviso: Story = {
  args: { type: 'warning', message: 'O prazo vence em 3 horas.' },
};

export const Erro: Story = {
  args: { type: 'error', message: 'Não foi possível salvar.', description: 'Tente novamente em instantes.' },
};

export const ComAcao: Story = {
  args: { type: 'error', message: 'Falha ao carregar.' },
  render: (args) => ({ props: { ...args }, template: `<app-alert [type]="type" [message]="message"><app-button size="small">Tentar de novo</app-button></app-alert>` }),
};

