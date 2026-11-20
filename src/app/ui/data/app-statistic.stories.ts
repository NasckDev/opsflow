import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppStatistic } from './app-statistic';

const meta: Meta<AppStatistic> = {
  title: 'UI/Statistic',
  component: AppStatistic,
  decorators: [moduleMetadata({ imports: [AppStatistic] })],
  args: { title: 'Solicitações em andamento', value: 14, suffix: '', icon: 'clock-circle', tone: 'default', loading: false, animated: true },
  argTypes: { tone: { control: 'select', options: ['default', 'success', 'danger', 'warning'] } },
};
export default meta;
type Story = StoryObj<AppStatistic>;

export const Padrao: Story = {
};

export const Sucesso: Story = {
  args: { title: 'SLA cumprido', value: 92, suffix: '%', icon: 'check-circle', tone: 'success' },
};

export const Perigo: Story = {
  args: { title: 'Vencidas em aberto', value: 3, icon: 'exclamation-circle', tone: 'danger' },
};

export const Carregando: Story = {
  args: { loading: true },
};

export const SemDados: Story = {
  args: { value: '—' },
};

