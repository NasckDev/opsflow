import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppSkeleton } from './app-skeleton';

const meta: Meta<AppSkeleton> = {
  title: 'UI/Skeleton',
  component: AppSkeleton,
  decorators: [moduleMetadata({ imports: [AppSkeleton] })],
  args: { label: 'Carregando solicitações…', rows: 2, count: 1, avatar: false, title: true, active: true },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppSkeleton>;

export const Padrao: Story = {
};

export const ComAvatar: Story = {
  args: { avatar: true, rows: 3 },
};

export const Lista: Story = {
  args: { count: 4, rows: 1 },
};

