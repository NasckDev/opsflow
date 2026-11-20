import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AppSwitch } from './app-switch';

const meta: Meta<AppSwitch> = {
  title: 'UI/Switch',
  component: AppSwitch,
  decorators: [moduleMetadata({ imports: [AppSwitch, ReactiveFormsModule] })],
  args: { ariaLabel: 'Tema escuro', loading: false },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppSwitch>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl(false) }, template: `<app-switch [formControl]="control" ariaLabel="Tema escuro" />` }),
};

export const Ligado: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl(true) }, template: `<app-switch [formControl]="control" ariaLabel="Tema escuro" />` }),
};

export const Carregando: Story = {
  args: { loading: true },
  render: (args) => ({ props: { ...args, control: new FormControl(true) }, template: `<app-switch [formControl]="control" [loading]="loading" ariaLabel="Tema escuro" />` }),
};

export const Desabilitado: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl({ value: false, disabled: true }) }, template: `<app-switch [formControl]="control" ariaLabel="Tema escuro" />` }),
};

