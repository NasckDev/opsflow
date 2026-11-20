import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AppDatePicker } from './app-date-picker';

const meta: Meta<AppDatePicker> = {
  title: 'UI/DatePicker',
  component: AppDatePicker,
  decorators: [moduleMetadata({ imports: [AppDatePicker, ReactiveFormsModule] })],
  args: { showTime: true, invalid: false, placeholder: 'Escolha data e hora' },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppDatePicker>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl('2026-12-01T18:00') }, template: `<app-date-picker [formControl]="control" [showTime]="showTime" ariaLabel="Prazo" />` }),
};

export const SoData: Story = {
  args: { showTime: false },
  render: (args) => ({ props: { ...args, control: new FormControl('2026-12-01T18:00') }, template: `<app-date-picker [formControl]="control" [showTime]="showTime" ariaLabel="Prazo" />` }),
};

export const Erro: Story = {
  args: { invalid: true },
  render: (args) => ({ props: { ...args, control: new FormControl('') }, template: `<app-date-picker [formControl]="control" [invalid]="invalid" ariaLabel="Prazo" />` }),
};

export const Desabilitado: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl({ value: '2026-12-01T18:00', disabled: true }) }, template: `<app-date-picker [formControl]="control" ariaLabel="Prazo" />` }),
};

