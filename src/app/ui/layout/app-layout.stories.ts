import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppLayout } from './app-layout';

const meta: Meta<AppLayout> = {
  title: 'UI/Layout',
  component: AppLayout,
  decorators: [moduleMetadata({ imports: [AppLayout] })],
  args: { collapsed: false, mobile: false, siderWidth: 210 },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppLayout>;

export const Desktop: Story = {
  render: (args) => ({ props: { ...args }, template: `<div style="height: 320px"><app-layout [mobile]="mobile" [collapsed]="collapsed"><div appLayoutSider style="padding: 16px">Menu</div><div appLayoutHeader>Cabeçalho</div><div style="padding: 16px">Conteúdo da página</div></app-layout></div>` }),
};

export const Recolhido: Story = {
  args: { collapsed: true },
  render: (args) => ({ props: { ...args }, template: `<div style="height: 320px"><app-layout [mobile]="mobile" [collapsed]="collapsed"><div appLayoutSider style="padding: 16px">M</div><div appLayoutHeader>Cabeçalho</div><div style="padding: 16px">Conteúdo da página</div></app-layout></div>` }),
};

export const Celular: Story = {
  args: { mobile: true },
  render: (args) => ({ props: { ...args }, template: `<div style="height: 320px"><app-layout [mobile]="mobile"><div appLayoutHeader>Cabeçalho</div><div style="padding: 16px">Conteúdo da página</div></app-layout></div>` }),
};

