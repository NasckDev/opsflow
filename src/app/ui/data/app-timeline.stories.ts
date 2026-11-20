import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { AppTimeline } from './app-timeline';

const meta: Meta<AppTimeline> = {
  title: 'UI/Timeline',
  component: AppTimeline,
  decorators: [moduleMetadata({ imports: [AppTimeline] })],
  args: { marks: [{ key: '1', tone: 'info', icon: 'send' }, { key: '2', tone: 'violet', icon: 'undo' }, { key: '3', tone: 'success', icon: 'check-circle' }], data: [{ title: 'Enviada para revisão', who: 'Ana Souza' }, { title: 'Devolvida para ajuste', who: 'Bruno Lima' }, { title: 'Aprovada', who: 'Carla Mendes' }] },
  argTypes: {},
};
export default meta;
type Story = StoryObj<AppTimeline>;

export const Padrao: Story = {
  render: (args) => ({ props: { ...args }, template: `<app-timeline [marks]="marks" [data]="data"><ng-template let-entry><strong>{{ entry.title }}</strong><div>{{ entry.who }}</div></ng-template></app-timeline>` }),
};

export const Vazio: Story = {
  args: { marks: [], data: [] },
  render: (args) => ({ props: { ...args }, template: `<app-timeline [marks]="marks" [data]="data"><ng-template let-entry>{{ entry.title }}</ng-template></app-timeline>` }),
};

