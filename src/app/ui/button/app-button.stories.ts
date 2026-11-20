import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppButton } from './app-button';

const meta: Meta<AppButton> = {
  title: 'UI/Button',
  component: AppButton,
  decorators: [moduleMetadata({ imports: [AppButton] })],
  args: { variant: 'default', size: null, loading: false, disabled: false, icon: null, danger: false, tone: 'default', block: false },
  argTypes: { variant: { control: 'select', options: ['primary', 'default', 'dashed', 'text', 'link'] }, size: { control: 'select', options: [null, 'small', 'middle', 'large'] }, tone: { control: 'select', options: ['default', 'success'] } },
};
export default meta;
type Story = StoryObj<AppButton>;

export const Padrao: Story = {
  args: { variant: 'default' },
  render: (args) => ({ props: { ...args }, template: `<app-button [variant]="variant" [size]="size" [loading]="loading" [disabled]="disabled" [icon]="icon" [danger]="danger" [tone]="tone">Aprovar solicitação</app-button>` }),
};

export const Primario: Story = {
  args: { variant: 'primary', icon: 'check' },
  render: (args) => ({ props: { ...args }, template: `<app-button [variant]="variant" [size]="size" [loading]="loading" [disabled]="disabled" [icon]="icon" [danger]="danger" [tone]="tone">Aprovar solicitação</app-button>` }),
};

export const Sucesso: Story = {
  args: { variant: 'primary', tone: 'success', icon: 'check' },
  render: (args) => ({ props: { ...args }, template: `<app-button [variant]="variant" [size]="size" [loading]="loading" [disabled]="disabled" [icon]="icon" [danger]="danger" [tone]="tone">Aprovar solicitação</app-button>` }),
};

export const Perigo: Story = {
  args: { variant: 'default', danger: true, icon: 'close' },
  render: (args) => ({ props: { ...args }, template: `<app-button [variant]="variant" [size]="size" [loading]="loading" [disabled]="disabled" [icon]="icon" [danger]="danger" [tone]="tone">Aprovar solicitação</app-button>` }),
};

export const Carregando: Story = {
  args: { variant: 'primary', loading: true },
  render: (args) => ({ props: { ...args }, template: `<app-button [variant]="variant" [size]="size" [loading]="loading" [disabled]="disabled" [icon]="icon" [danger]="danger" [tone]="tone">Aprovar solicitação</app-button>` }),
};

export const Desabilitado: Story = {
  args: { variant: 'primary', disabled: true },
  render: (args) => ({ props: { ...args }, template: `<app-button [variant]="variant" [size]="size" [loading]="loading" [disabled]="disabled" [icon]="icon" [danger]="danger" [tone]="tone">Aprovar solicitação</app-button>` }),
};

export const Texto: Story = {
  args: { variant: 'text' },
  render: (args) => ({ props: { ...args }, template: `<app-button [variant]="variant" [size]="size" [loading]="loading" [disabled]="disabled" [icon]="icon" [danger]="danger" [tone]="tone">Aprovar solicitação</app-button>` }),
};

export const Link: Story = {
  args: { variant: 'link' },
  render: (args) => ({ props: { ...args }, template: `<app-button [variant]="variant" [size]="size" [loading]="loading" [disabled]="disabled" [icon]="icon" [danger]="danger" [tone]="tone">Aprovar solicitação</app-button>` }),
};

