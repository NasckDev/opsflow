import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppButton } from '../button/app-button';
import { AppPageHeader } from './app-page-header';

const meta: Meta<AppPageHeader> = {
  title: 'UI/PageHeader',
  component: AppPageHeader,
  decorators: [moduleMetadata({ imports: [AppPageHeader, AppButton] })],
  args: { title: 'Solicitações', subtitle: 'Acompanhe tudo o que está em andamento.', breadcrumb: [{ label: 'OpsFlow', href: '#/inbox' }, { label: 'Solicitações' }], titleId: 'page-title' },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppPageHeader>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-page-header [title]="title" [subtitle]="subtitle" [breadcrumb]="breadcrumb"><div appPageActions><app-button variant="primary" icon="plus">Nova solicitação</app-button></div></app-page-header>` }),
};

export const SemTrilha: Story = {
  args: { breadcrumb: [] },
  render: (args) => ({ props: { ...args }, template: `<app-page-header [title]="title" [subtitle]="subtitle" [breadcrumb]="breadcrumb" />` }),
};

