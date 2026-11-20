import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppSteps } from './app-steps';

const meta: Meta<AppSteps> = {
  title: 'UI/Steps',
  component: AppSteps,
  decorators: [moduleMetadata({ imports: [AppSteps] })],
  args: { steps: [{ title: 'Detalhes' }, { title: 'Prazo e anexos' }, { title: 'Revisão' }], current: 1, direction: 'horizontal', size: 'default', labelPlacement: 'horizontal', ariaLabel: 'Etapas da solicitação' },
  argTypes: { direction: { control: 'select', options: ['horizontal', 'vertical'] } },
};
export default meta;
type Story = StoryObj<AppSteps>;

export const Padrao: Story = {
};

export const Vertical: Story = {
  args: { direction: 'vertical', current: 1 },
};

export const ComErro: Story = {
  args: { steps: [{ title: 'Solicitação', status: 'finish' }, { title: 'Revisão', status: 'error', description: 'Devolvida' }, { title: 'Aprovação', status: 'wait' }] },
};

