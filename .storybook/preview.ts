import { applicationConfig } from '@storybook/angular';
import type { Preview } from '@storybook/angular';
import { provideUi } from '../src/app/ui';

// Storybook com o tema do app (tokens, fontes IBM Plex e tema claro do NG-ZORRO) e o addon de a11y.
const preview: Preview = {
  decorators: [applicationConfig({ providers: [provideUi()] })],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    a11y: { test: 'error' },
  },
  tags: ['autodocs'],
};

export default preview;
