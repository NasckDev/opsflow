import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppDrawer } from './app-drawer';

const meta: Meta<AppDrawer> = {
  title: 'UI/Drawer',
  component: AppDrawer,
  decorators: [moduleMetadata({ imports: [AppDrawer] })],
  args: { open: true, title: 'Notificações', placement: 'right', width: 400, height: 'auto' },
  argTypes: { placement: { control: 'select', options: ['left', 'right', 'top', 'bottom'] } },
};
export default meta;
type Story = StoryObj<AppDrawer>;

export const Direita: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-drawer [open]="open" [title]="title" [placement]="placement" [width]="width">Conteúdo da gaveta.</app-drawer>` }),
};

export const Inferior: Story = {
  args: { placement: 'bottom', height: 240 },
  render: (args) => ({ props: { ...args }, template: `<app-drawer [open]="open" [title]="title" [placement]="placement" [height]="height">Folha inferior (celular).</app-drawer>` }),
};

export const Esquerda: Story = {
  args: { placement: 'left', title: 'Menu' },
  render: (args) => ({ props: { ...args }, template: `<app-drawer [open]="open" [title]="title" [placement]="placement" [width]="width">Navegação.</app-drawer>` }),
};

