import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppSegmented } from './app-segmented';

const meta: Meta<AppSegmented> = {
  title: 'UI/Segmented',
  component: AppSegmented,
  decorators: [moduleMetadata({ imports: [AppSegmented] })],
  args: { options: [{ value: 'chart', label: 'Gráfico' }, { value: 'table', label: 'Tabela' }], value: 'chart', ariaLabel: 'Forma de exibição' },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppSegmented>;

export const Padrao: Story = {
};

export const TresOpcoes: Story = {
  args: { options: [{ value: 'a', label: 'Dia' }, { value: 'b', label: 'Semana' }, { value: 'c', label: 'Mês' }], value: 'b' },
};

