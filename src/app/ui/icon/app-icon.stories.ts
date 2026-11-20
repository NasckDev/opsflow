import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppIcon } from './app-icon';

const meta: Meta<AppIcon> = {
  title: 'UI/Icon',
  component: AppIcon,
  decorators: [moduleMetadata({ imports: [AppIcon] })],
  args: { name: 'inbox', size: 1.5, spin: false, label: '', filled: false },
  argTypes: { name: { control: 'text' }, size: { control: { type: 'number', step: 0.25 } } },
};
export default meta;
type Story = StoryObj<AppIcon>;

export const Padrao: Story = {
};

export const Grande: Story = {
  args: { name: 'bell', size: 2 },
};

export const Girando: Story = {
  args: { name: 'loading', spin: true },
};

