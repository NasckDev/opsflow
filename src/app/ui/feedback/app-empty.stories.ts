import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppButton } from '../button/app-button';
import { AppEmpty } from './app-empty';

const meta: Meta<AppEmpty> = {
  title: 'UI/Empty',
  component: AppEmpty,
  decorators: [moduleMetadata({ imports: [AppEmpty, AppButton] })],
  args: { title: 'Nenhuma solicitação por aqui', description: 'Crie uma nova solicitação para começar.', image: 'simple' },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppEmpty>;

export const Padrao: Story = {
};

export const ComAcao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-empty [title]="title" [description]="description"><app-button variant="primary" icon="plus">Nova solicitação</app-button></app-empty>` }),
};

export const SemDescricao: Story = {
  args: { description: '' },
};

