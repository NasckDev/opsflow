import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppTag } from './app-tag';

const meta: Meta<AppTag> = {
  title: 'UI/Tag',
  component: AppTag,
  decorators: [moduleMetadata({ imports: [AppTag] })],
  args: { tone: 'default', icon: null, checkable: false, checked: false, bordered: true },
  argTypes: { tone: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'info', 'violet', 'neutral'] } },
};
export default meta;
type Story = StoryObj<AppTag>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-tag [tone]="tone" [icon]="icon" [checkable]="checkable" [checked]="checked">Em revisão</app-tag>` }),
};

export const Sucesso: Story = {
  args: { tone: 'success', icon: 'check-circle' },
  render: (args) => ({ props: { ...args }, template: `<app-tag [tone]="tone" [icon]="icon" [checkable]="checkable" [checked]="checked">Em revisão</app-tag>` }),
};

export const Alerta: Story = {
  args: { tone: 'warning', icon: 'clock-circle' },
  render: (args) => ({ props: { ...args }, template: `<app-tag [tone]="tone" [icon]="icon" [checkable]="checkable" [checked]="checked">Em revisão</app-tag>` }),
};

export const Perigo: Story = {
  args: { tone: 'danger', icon: 'close-circle' },
  render: (args) => ({ props: { ...args }, template: `<app-tag [tone]="tone" [icon]="icon" [checkable]="checkable" [checked]="checked">Em revisão</app-tag>` }),
};

export const Devolvida: Story = {
  args: { tone: 'violet', icon: 'undo' },
  render: (args) => ({ props: { ...args }, template: `<app-tag [tone]="tone" [icon]="icon" [checkable]="checkable" [checked]="checked">Em revisão</app-tag>` }),
};

export const Filtro: Story = {
  args: { checkable: true, checked: false },
  render: (args) => ({ props: { ...args }, template: `<app-tag [tone]="tone" [icon]="icon" [checkable]="checkable" [checked]="checked">Em revisão</app-tag>` }),
};

export const FiltroAtivo: Story = {
  args: { checkable: true, checked: true },
  render: (args) => ({ props: { ...args }, template: `<app-tag [tone]="tone" [icon]="icon" [checkable]="checkable" [checked]="checked">Em revisão</app-tag>` }),
};

