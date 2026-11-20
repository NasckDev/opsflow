import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppBreadcrumb } from './app-breadcrumb';

const meta: Meta<AppBreadcrumb> = {
  title: 'UI/Breadcrumb',
  component: AppBreadcrumb,
  decorators: [moduleMetadata({ imports: [AppBreadcrumb] })],
  args: { items: [{ label: 'OpsFlow', href: '#/inbox' }, { label: 'Solicitações', href: '#/requests' }, { label: 'REQ-2041' }] },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppBreadcrumb>;

export const Padrao: Story = {
};

