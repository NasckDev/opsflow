import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AppSelect } from './app-select';

const meta: Meta<AppSelect> = {
  title: 'UI/Select',
  component: AppSelect,
  decorators: [moduleMetadata({ imports: [AppSelect, ReactiveFormsModule] })],
  args: { options: [{ value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' }, { value: 'high', label: 'Alta' }], placeholder: 'Escolha a prioridade', invalid: false },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppSelect>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl('medium') }, template: `<app-select [formControl]="control" [options]="options" [placeholder]="placeholder" ariaLabel="Prioridade" />` }),
};

export const SemSelecao: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl(null) }, template: `<app-select [formControl]="control" [options]="options" [placeholder]="placeholder" [allowClear]="true" ariaLabel="Prioridade" />` }),
};

export const Erro: Story = {
  args: { invalid: true },
  render: (args) => ({ props: { ...args, control: new FormControl(null) }, template: `<app-select [formControl]="control" [options]="options" [invalid]="invalid" ariaLabel="Prioridade" />` }),
};

export const Desabilitado: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl({ value: 'high', disabled: true }) }, template: `<app-select [formControl]="control" [options]="options" ariaLabel="Prioridade" />` }),
};

