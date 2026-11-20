import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppIconButton } from '../button/app-icon-button';
import { AppBadge } from './app-badge';

const meta: Meta<AppBadge> = {
  title: 'UI/Badge',
  component: AppBadge,
  decorators: [moduleMetadata({ imports: [AppBadge, AppIconButton] })],
  args: { count: 3, dot: false, standalone: false, tone: 'danger' },
  argTypes: { tone: { control: 'select', options: ['danger', 'primary'] } },
};
export default meta;
type Story = StoryObj<AppBadge>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-badge [count]="count" [tone]="tone"><app-icon-button icon="bell" label="Notificações" /></app-badge>` }),
};

export const Zero: Story = {
  args: { count: 0 },
  render: (args) => ({ props: { ...args }, template: `<app-badge [count]="count"><app-icon-button icon="bell" label="Notificações" /></app-badge>` }),
};

export const Primario: Story = {
  args: { tone: 'primary', count: 12 },
  render: (args) => ({ props: { ...args }, template: `<app-badge [count]="count" [tone]="tone"><app-icon-button icon="inbox" label="Caixa de entrada" /></app-badge>` }),
};

export const Avulso: Story = {
  args: { standalone: true, count: 5 },
  render: (args) => ({ props: { ...args }, template: `<app-badge [count]="count" [standalone]="standalone" />` }),
};

