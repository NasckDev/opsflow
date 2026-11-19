import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Ícones SVG inline (grade 24, traço), sem dependência externa. */
const ICONS = {
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'M21 21l-4.3-4.3'],
  chevronDown: ['m6 9 6 6 6-6'],
  chevronRight: ['m9 18 6-6-6-6'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  arrowLeft: ['M19 12H5', 'M12 19l-7-7 7-7'],
  arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
  moon: ['M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z'],
  sun: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    'M12 2v2',
    'M12 20v2',
    'M4.9 4.9l1.4 1.4',
    'M17.7 17.7l1.4 1.4',
    'M2 12h2',
    'M20 12h2',
    'M4.9 19.1l1.4-1.4',
    'M17.7 6.3l1.4-1.4',
  ],
  alert: [
    'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    'M12 9v4',
    'M12 17h.01',
  ],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
  send: ['m22 2-7 20-4-9-9-4 20-7z', 'M22 2 11 13'],
  undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  checkCircle: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'm8.5 12.5 2.5 2.5 4.5-5'],
  xCircle: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'm15 9-6 6', 'm9 9 6 6'],
  plusCircle: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 8v8', 'M8 12h8'],
  history: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5', 'M12 7v5l3 2'],
  file: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5'],
  refresh: [
    'M21 12a9 9 0 0 1-15.4 6.4L3 16',
    'M3 21v-5h5',
    'M3 12A9 9 0 0 1 18.4 5.6L21 8',
    'M21 3v5h-5',
  ],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  calendar: [
    'M8 2v4',
    'M16 2v4',
    'M3 10h18',
    'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  ],
  priorityHigh: ['m17 11-5-5-5 5', 'm17 18-5-5-5 5'],
  priorityMedium: ['M5 9h14', 'M5 15h14'],
  priorityLow: ['m7 6 5 5 5-5', 'm7 13 5 5 5-5'],
  sortAsc: ['m7 14 5-5 5 5'],
  sortDesc: ['m7 10 5 5 5-5'],
  sortNone: ['m8 9 4-4 4 4', 'm8 15 4 4 4-4'],
  inbox: [
    'M22 12h-6l-2 3h-4l-2-3H2',
    'M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z',
  ],
  wifiOff: [
    'M2 8.8a15 15 0 0 1 4-2.4',
    'M10 5.1a15 15 0 0 1 12 3.7',
    'M5 12.9a10 10 0 0 1 5-2.7',
    'M13.5 10.3a10 10 0 0 1 5.5 2.6',
    'M8.5 16.4a5 5 0 0 1 7 0',
    'M12 20h.01',
    'M2 2l20 20',
  ],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.width.rem]': 'size()', '[style.height.rem]': 'size()' },
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(1.125);
  protected readonly paths = computed(() => ICONS[this.name()]);
}
