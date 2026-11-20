import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppBottomNav } from './app-bottom-nav';

const meta: Meta<AppBottomNav> = {
  title: 'UI/BottomNav',
  component: AppBottomNav,
  decorators: [moduleMetadata({ imports: [AppBottomNav] })],
  args: { items: [{ key: 'inbox', label: 'Caixa', icon: 'inbox', href: '#/inbox', badge: 3 }, { key: 'board', label: 'Quadro', icon: 'project', href: '#/board' }, { key: 'requests', label: 'Solicitações', icon: 'unordered-list', href: '#/requests' }, { key: 'more', label: 'Mais', icon: 'ellipsis' }], activeKey: 'inbox' },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppBottomNav>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<div style="height: 120px; position: relative"><app-bottom-nav [items]="items" [activeKey]="activeKey" /></div>` }),
};

