import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppStatus } from './app-status';

const meta: Meta<AppStatus> = {
  title: 'UI/Status',
  component: AppStatus,
  decorators: [moduleMetadata({ imports: [AppStatus] })],
  args: { status: 'warning', label: 'Pendente' },
  argTypes: { status: { control: 'select', options: ['success', 'processing', 'default', 'error', 'warning'] } },
};
export default meta;
type Story = StoryObj<AppStatus>;

export const Padrao: Story = {
};

export const Sucesso: Story = {
  args: { status: 'success', label: 'Aprovada' },
};

export const Erro: Story = {
  args: { status: 'error', label: 'Rejeitada' },
};

export const Processando: Story = {
  args: { status: 'processing', label: 'Em análise' },
};

