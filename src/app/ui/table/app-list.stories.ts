import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppList } from './app-list';

const meta: Meta<AppList> = {
  title: 'UI/List',
  component: AppList,
  decorators: [moduleMetadata({ imports: [AppList] })],
  args: { data: [{ id: '1', code: 'REQ-2041', title: 'Compra de notebooks', amount: 'R$ 18.400,00' }, { id: '2', code: 'REQ-2042', title: 'Viagem para conferência', amount: 'R$ 4.800,00' }, { id: '3', code: 'REQ-2043', title: 'Acesso ao ERP', amount: 'R$ 0,00' }] },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppList>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-list [data]="data" ariaLabel="Solicitações"><ng-template let-item><strong>{{ item.code }}</strong> {{ item.title }}</ng-template></app-list>` }),
};

export const Vazia: Story = {
  args: { data: [] },
  render: (args) => ({ props: { ...args }, template: `<app-list [data]="data"><ng-template let-item>{{ item.title }}</ng-template></app-list>` }),
};

