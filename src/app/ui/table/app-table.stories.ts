import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppTableCell } from './app-table';
import { AppTable } from './app-table';

const meta: Meta<AppTable> = {
  title: 'UI/Table',
  component: AppTable,
  decorators: [moduleMetadata({ imports: [AppTable, AppTableCell] })],
  args: { columns: [{ key: 'code', title: 'Código', sortable: true }, { key: 'title', title: 'Título', sortable: true }, { key: 'amount', title: 'Valor', align: 'right' }], data: [{ id: '1', code: 'REQ-2041', title: 'Compra de notebooks', amount: 'R$ 18.400,00' }, { id: '2', code: 'REQ-2042', title: 'Viagem para conferência', amount: 'R$ 4.800,00' }, { id: '3', code: 'REQ-2043', title: 'Acesso ao ERP', amount: 'R$ 0,00' }], loading: false, pageSize: 10, sort: null },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppTable>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-table [columns]="columns" [data]="data" [loading]="loading" [sort]="sort" sortLabel="Ordenar por"><ng-template appTableCell="code" let-row><span class="mono">{{ row.code }}</span></ng-template><ng-template appTableCell="title" let-row>{{ row.title }}</ng-template><ng-template appTableCell="amount" let-row>{{ row.amount }}</ng-template><div appTableEmpty>Nenhuma solicitação encontrada.</div></app-table>` }),
};

export const Ordenada: Story = {
  args: { sort: { key: 'code', direction: 'desc' } },
  render: (args) => ({ props: { ...args }, template: `<app-table [columns]="columns" [data]="data" [loading]="loading" [sort]="sort" sortLabel="Ordenar por"><ng-template appTableCell="code" let-row><span class="mono">{{ row.code }}</span></ng-template><ng-template appTableCell="title" let-row>{{ row.title }}</ng-template><ng-template appTableCell="amount" let-row>{{ row.amount }}</ng-template><div appTableEmpty>Nenhuma solicitação encontrada.</div></app-table>` }),
};

export const Carregando: Story = {
  args: { loading: true },
  render: (args) => ({ props: { ...args }, template: `<app-table [columns]="columns" [data]="data" [loading]="loading" [sort]="sort" sortLabel="Ordenar por"><ng-template appTableCell="code" let-row><span class="mono">{{ row.code }}</span></ng-template><ng-template appTableCell="title" let-row>{{ row.title }}</ng-template><ng-template appTableCell="amount" let-row>{{ row.amount }}</ng-template><div appTableEmpty>Nenhuma solicitação encontrada.</div></app-table>` }),
};

export const Vazia: Story = {
  args: { data: [] },
  render: (args) => ({ props: { ...args }, template: `<app-table [columns]="columns" [data]="data" [loading]="loading" [sort]="sort" sortLabel="Ordenar por"><ng-template appTableCell="code" let-row><span class="mono">{{ row.code }}</span></ng-template><ng-template appTableCell="title" let-row>{{ row.title }}</ng-template><ng-template appTableCell="amount" let-row>{{ row.amount }}</ng-template><div appTableEmpty>Nenhuma solicitação encontrada.</div></app-table>` }),
};

