import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppButton } from '../button/app-button';
import { AppTooltip } from './app-tooltip';

const meta: Meta<AppTooltip> = {
  title: 'UI/Tooltip',
  component: AppTooltip,
  decorators: [moduleMetadata({ imports: [AppTooltip, AppButton] })],
  args: {},
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppTooltip>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-button appTooltip="Aprova a solicitação e registra na auditoria">Aprovar</app-button>` }),
};

