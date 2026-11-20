import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AppInput } from './app-input';

const meta: Meta<AppInput> = {
  title: 'UI/Input',
  component: AppInput,
  decorators: [moduleMetadata({ imports: [AppInput, ReactiveFormsModule] })],
  args: { type: 'text', placeholder: 'Descreva a solicitação', invalid: false, prefixIcon: null, clearable: false, rows: 3 },
  argTypes: { type: { control: 'select', options: ['text', 'number', 'search', 'password', 'textarea'] } },
};
export default meta;
type Story = StoryObj<AppInput>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl('Compra de notebooks') }, template: `<app-input [formControl]="control" [placeholder]="placeholder" ariaLabel="Título" />` }),
};

export const Vazio: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl('') }, template: `<app-input [formControl]="control" [placeholder]="placeholder" ariaLabel="Título" />` }),
};

export const Busca: Story = {
  args: { type: 'search', prefixIcon: 'search', clearable: true, placeholder: 'Buscar por código ou título' },
  render: (args) => ({ props: { ...args, control: new FormControl('REQ-2041') }, template: `<app-input [formControl]="control" [type]="type" [prefixIcon]="prefixIcon" [clearable]="clearable" [placeholder]="placeholder" ariaLabel="Buscar" />` }),
};

export const Numero: Story = {
  args: { type: 'number', placeholder: '0,00' },
  render: (args) => ({ props: { ...args, control: new FormControl(1200) }, template: `<app-input [formControl]="control" [type]="type" [placeholder]="placeholder" ariaLabel="Valor" />` }),
};

export const AreaDeTexto: Story = {
  args: { type: 'textarea', rows: 4 },
  render: (args) => ({ props: { ...args, control: new FormControl('Preciso de mais detalhes do fornecedor.') }, template: `<app-input [formControl]="control" [type]="type" [rows]="rows" ariaLabel="Comentário" />` }),
};

export const Erro: Story = {
  args: { invalid: true },
  render: (args) => ({ props: { ...args, control: new FormControl('abc') }, template: `<app-input [formControl]="control" [invalid]="invalid" ariaLabel="Título" />` }),
};

export const Desabilitado: Story = {
  render: (args) => ({ props: { ...args, control: new FormControl({ value: 'Somente leitura', disabled: true }) }, template: `<app-input [formControl]="control" ariaLabel="Título" />` }),
};

