import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AppInput } from './app-input';
import { AppFormItem } from './app-form-item';

const meta: Meta<AppFormItem> = {
  title: 'UI/FormItem',
  component: AppFormItem,
  decorators: [moduleMetadata({ imports: [AppFormItem, ReactiveFormsModule, AppInput] })],
  args: { label: 'Título', forId: 'f1', required: true, hint: 'Seja específico.', error: null },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppFormItem>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl('') }, template: `<app-form-item forId="f1" [label]="label" [required]="required" [hint]="hint" [error]="error"><app-input inputId="f1" [formControl]="control" /></app-form-item>` }),
};

export const ComErro: Story = {
  args: { error: 'Informe o título (mínimo de 5 letras).' },
  render: (args) => ({ props: { ...args, control: new FormControl('') }, template: `<app-form-item forId="f2" [label]="label" [required]="required" [error]="error"><app-input inputId="f2" [formControl]="control" [invalid]="true" describedBy="f2-error" /></app-form-item>` }),
};

