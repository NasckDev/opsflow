import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppIconButton } from './app-icon-button';

const meta: Meta<AppIconButton> = {
  title: 'UI/IconButton',
  component: AppIconButton,
  decorators: [moduleMetadata({ imports: [AppIconButton] })],
  args: { icon: 'bell', label: 'Notificações', variant: 'text', disabled: false, loading: false, danger: false },
  argTypes: { variant: { control: 'select', options: ['primary', 'default', 'dashed', 'text', 'link'] } },
};
export default meta;
type Story = StoryObj<AppIconButton>;

export const Padrao: Story = {
};

export const Desabilitado: Story = {
  args: { disabled: true },
};

export const Carregando: Story = {
  args: { loading: true },
};

export const Perigo: Story = {
  args: { icon: 'delete', label: 'Excluir', danger: true },
};

