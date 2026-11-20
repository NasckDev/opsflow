import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AppCheckbox } from './app-checkbox';

const meta: Meta<AppCheckbox> = {
  title: 'UI/Checkbox',
  component: AppCheckbox,
  decorators: [moduleMetadata({ imports: [AppCheckbox, ReactiveFormsModule] })],
  args: { indeterminate: false },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppCheckbox>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl(false) }, template: `<app-checkbox [formControl]="control">Selecionar solicitação</app-checkbox>` }),
};

export const Marcada: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl(true) }, template: `<app-checkbox [formControl]="control">Selecionar solicitação</app-checkbox>` }),
};

export const Desabilitada: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl({ value: true, disabled: true }) }, template: `<app-checkbox [formControl]="control">Selecionar solicitação</app-checkbox>` }),
};

