import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppButton } from '../button/app-button';
import { AppModal } from './app-modal';

const meta: Meta<AppModal> = {
  title: 'UI/Modal',
  component: AppModal,
  decorators: [moduleMetadata({ imports: [AppModal, AppButton] })],
  args: { open: true, title: 'Devolver solicitação', width: 480, footer: true, centered: true, closable: true, maskClosable: true },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppModal>;

export const Aberto: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-modal [open]="open" [title]="title" [footer]="footer" [width]="width">Confirme para devolver a solicitação ao solicitante.<div appModalFooter><app-button>Cancelar</app-button> <app-button variant="primary">Devolver</app-button></div></app-modal>` }),
};

export const SemRodape: Story = {
  args: { footer: false },
  render: (args) => ({ props: { ...args }, template: `<app-modal [open]="open" [title]="title" [footer]="footer">Somente leitura.</app-modal>` }),
};

