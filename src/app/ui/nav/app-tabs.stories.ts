import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppTabs } from './app-tabs';

const meta: Meta<AppTabs> = {
  title: 'UI/Tabs',
  component: AppTabs,
  decorators: [moduleMetadata({ imports: [AppTabs] })],
  args: { tabs: [{ key: 'in_review', label: 'Em revisão', count: 5 }, { key: 'approved', label: 'Aprovadas', count: 12 }, { key: 'rejected', label: 'Rejeitadas', count: 0 }], activeKey: 'in_review', type: 'line', size: 'default' },
  argTypes: { type: { control: 'select', options: ['line', 'card'] } },
};
export default meta;
type Story = StoryObj<AppTabs>;

export const Padrao: Story = {
};

export const Cartao: Story = {
  args: { type: 'card' },
};

