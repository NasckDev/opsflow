import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppButton } from '../button/app-button';
import { AppDropdown } from './app-dropdown';

const meta: Meta<AppDropdown> = {
  title: 'UI/Dropdown',
  component: AppDropdown,
  decorators: [moduleMetadata({ imports: [AppDropdown, AppButton] })],
  args: { items: [{ key: 'in_review', label: 'Em revisão' }, { key: 'approved', label: 'Aprovada' }] },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppDropdown>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-dropdown [items]="items"><app-button icon="swap">Mover para</app-button></app-dropdown>` }),
};

export const ComPerigo: Story = {
  args: { items: [{ key: 'edit', label: 'Editar' }, { key: 'delete', label: 'Excluir', danger: true }, { key: 'lock', label: 'Bloqueado', disabled: true }] },
  render: (args) => ({ props: { ...args }, template: `<app-dropdown [items]="items"><app-button>Ações</app-button></app-dropdown>` }),
};

