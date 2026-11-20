import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppPagination } from './app-pagination';

const meta: Meta<AppPagination> = {
  title: 'UI/Pagination',
  component: AppPagination,
  decorators: [moduleMetadata({ imports: [AppPagination] })],
  args: { total: 45, pageSize: 10, page: 2, simple: true },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppPagination>;

export const Padrao: Story = {
};

export const Completa: Story = {
  args: { simple: false, total: 120 },
};

export const UmaPagina: Story = {
  args: { total: 8 },
};

