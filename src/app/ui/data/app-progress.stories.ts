import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppProgress } from './app-progress';

const meta: Meta<AppProgress> = {
  title: 'UI/Progress',
  component: AppProgress,
  decorators: [moduleMetadata({ imports: [AppProgress] })],
  args: { value: 3, max: 8, label: 'Aprovando solicitações em lote', status: 'normal', showInfo: false, size: 'small' },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppProgress>;

export const Padrao: Story = {
};

export const Concluido: Story = {
  args: { value: 8, max: 8, status: 'success' },
};

export const Erro: Story = {
  args: { value: 3, max: 8, status: 'exception' },
};

export const Vazio: Story = {
  args: { value: 0 },
};

