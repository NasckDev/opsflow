import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppChart } from './app-chart';

const meta: Meta<AppChart> = {
  title: 'UI/Chart',
  component: AppChart,
  decorators: [moduleMetadata({ imports: [AppChart] })],
  args: { option: { grid: { left: 36, right: 12, top: 16, bottom: 28 }, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: ['S1', 'S2', 'S3', 'S4'] }, yAxis: { type: 'value' }, series: [{ type: 'bar', barMaxWidth: 18, data: [3, 6, 4, 9] }] }, height: 260, ariaLabel: 'Solicitações por semana' },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppChart>;

export const Barras: Story = {
};

export const Rosca: Story = {
  args: { option: { tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: ['50%', '75%'], label: { show: false }, data: [{ name: 'No prazo', value: 18 }, { name: 'Atrasadas', value: 4 }] }] }, ariaLabel: 'Cumprimento de SLA' },
};

export const Linha: Story = {
  args: { option: { grid: { left: 36, right: 12, top: 16, bottom: 28 }, xAxis: { type: 'category', data: ['S1', 'S2', 'S3', 'S4'] }, yAxis: { type: 'value' }, series: [{ type: 'line', smooth: true, data: [3, 6, 4, 9] }] }, ariaLabel: 'Vazão semanal' },
};

