import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppButton } from '../button/app-button';
import { AppResult } from './app-result';

const meta: Meta<AppResult> = {
  title: 'UI/Result',
  component: AppResult,
  decorators: [moduleMetadata({ imports: [AppResult, AppButton] })],
  args: { status: 'info', title: 'Título do resultado', description: 'Descrição opcional.' },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppResult>;

export const NaoEncontrado: Story = {
  args: { status: '404', title: 'Solicitação não encontrada', description: 'Ela pode ter sido removida.' },
};

export const SemAcesso: Story = {
  args: { status: '403', title: 'Sem acesso', description: 'Seu papel não vê esta solicitação.' },
};

export const Erro: Story = {
  args: { status: 'error', title: 'Algo deu errado' },
  render: (args) => ({ props: { ...args }, template: `<app-result [status]="status" [title]="title"><app-button variant="primary">Tentar de novo</app-button></app-result>` }),
};

export const Sucesso: Story = {
  args: { status: 'success', title: 'Solicitação enviada' },
};

