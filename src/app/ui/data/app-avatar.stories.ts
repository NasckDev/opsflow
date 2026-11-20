import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppAvatar } from './app-avatar';

const meta: Meta<AppAvatar> = {
  title: 'UI/Avatar',
  component: AppAvatar,
  decorators: [moduleMetadata({ imports: [AppAvatar] })],
  args: { name: 'Ana Souza', size: 'default', src: '' },
  argTypes: { size: { control: 'select', options: ['small', 'default', 'large'] } },
};
export default meta;
type Story = StoryObj<AppAvatar>;

export const Padrao: Story = {
};

export const Pequeno: Story = {
  args: { size: 'small', name: 'Bruno Lima' },
};

export const Grande: Story = {
  args: { size: 'large', name: 'Carla Mendes' },
};

export const NomeSimples: Story = {
  args: { name: 'Diego' },
};

