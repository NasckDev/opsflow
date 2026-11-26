import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppMenu } from './app-menu';

const meta: Meta<AppMenu> = {
  title: 'UI/Menu',
  component: AppMenu,
  decorators: [moduleMetadata({ imports: [AppMenu] })],
  args: { groups: [{ title: 'Workspace', items: [{ key: 'inbox', label: 'Caixa de entrada', icon: 'inbox', href: '#/inbox', badge: 4, badgeTone: 'signal' }, { key: 'requests', label: 'Solicitações', icon: 'unordered-list', href: '#/requests', badge: 27 }] }, { title: 'Gerenciar', items: [{ key: 'admin', label: 'Administração', icon: 'safety', href: '#/admin' }] }], selectedKey: 'inbox', collapsed: false },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppMenu>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<div style="width: 232px"><app-menu [groups]="groups" [selectedKey]="selectedKey" [collapsed]="collapsed" /></div>` }),
};

export const Recolhido: Story = {
  args: { collapsed: true },
  render: (args) => ({ props: { ...args }, template: `<div style="width: 64px"><app-menu [groups]="groups" [selectedKey]="selectedKey" [collapsed]="collapsed" /></div>` }),
};

