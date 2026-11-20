import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppDescriptionsItem } from './app-descriptions';
import { AppDescriptions } from './app-descriptions';

const meta: Meta<AppDescriptions> = {
  title: 'UI/Descriptions',
  component: AppDescriptions,
  decorators: [moduleMetadata({ imports: [AppDescriptions, AppDescriptionsItem] })],
  args: { column: 3, bordered: false, layout: 'vertical' },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppDescriptions>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-descriptions><app-descriptions-item label="Valor">R$ 4.800,00</app-descriptions-item><app-descriptions-item label="Categoria">Compra</app-descriptions-item><app-descriptions-item label="Prazo">22/11/2026 18:00</app-descriptions-item></app-descriptions>` }),
};

export const ComBorda: Story = {
  args: { bordered: true, layout: 'horizontal' },
  render: (args) => ({ props: { ...args }, template: `<app-descriptions [bordered]="bordered" [layout]="layout"><app-descriptions-item label="Solicitante">Ana Souza</app-descriptions-item><app-descriptions-item label="Aprovador">Carla Mendes</app-descriptions-item></app-descriptions>` }),
};

