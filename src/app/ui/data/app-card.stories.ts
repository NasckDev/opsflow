import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppCard } from './app-card';

const meta: Meta<AppCard> = {
  title: 'UI/Card',
  component: AppCard,
  decorators: [moduleMetadata({ imports: [AppCard] })],
  args: { title: 'Resumo da solicitação', bordered: true, hoverable: false, loading: false, size: 'default' },
  argTypes: { size: { control: 'select', options: ['default', 'small'] } },
};
export default meta;
type Story = StoryObj<AppCard>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-card [title]="title" [bordered]="bordered" [hoverable]="hoverable" [loading]="loading" [size]="size">Conteúdo do cartão com informações da solicitação.</app-card>` }),
};

export const Carregando: Story = {
  args: { loading: true },
  render: (args) => ({ props: { ...args }, template: `<app-card [title]="title" [loading]="loading">Conteúdo</app-card>` }),
};

export const ComAcao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-card [title]="title"><button appCardExtra type="button">Ação</button>Conteúdo do cartão.</app-card>` }),
};

export const Vazio: Story = {
  args: { title: '' },
  render: (args) => ({ props: { ...args }, template: `<app-card [title]="title">Cartão sem título.</app-card>` }),
};

