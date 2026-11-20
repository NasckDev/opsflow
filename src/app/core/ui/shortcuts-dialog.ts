import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppModal } from '../../ui';
import { TranslatePipe } from '../i18n/translate.pipe';
import { Shortcuts } from './shortcuts.service';

interface ShortcutGroup {
  readonly title: string;
  readonly items: readonly { readonly keys: readonly string[]; readonly label: string }[];
}

const GROUPS: readonly ShortcutGroup[] = [
  {
    title: 'shortcuts.group.global',
    items: [
      { keys: ['Ctrl', 'K'], label: 'shortcuts.palette' },
      { keys: ['?'], label: 'shortcuts.help' },
      { keys: ['/'], label: 'shortcuts.search' },
      { keys: ['g', 'i'], label: 'shortcuts.goInbox' },
      { keys: ['g', 'r'], label: 'shortcuts.goList' },
      { keys: ['g', 'b'], label: 'shortcuts.goBoard' },
      { keys: ['g', 'a'], label: 'shortcuts.goAnalytics' },
    ],
  },
  {
    title: 'shortcuts.group.inbox',
    items: [
      { keys: ['j'], label: 'shortcuts.next' },
      { keys: ['k'], label: 'shortcuts.previous' },
      { keys: ['Enter'], label: 'shortcuts.open' },
      { keys: ['x'], label: 'shortcuts.select' },
      { keys: ['a'], label: 'shortcuts.approve' },
      { keys: ['r'], label: 'shortcuts.reject' },
    ],
  },
];

@Component({
  selector: 'app-shortcuts-dialog',
  imports: [TranslatePipe, AppModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    h3 {
      margin: 1rem 0 0.5rem;
      color: var(--ox-color-text-muted);
      font-size: 0.6875rem;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }
    dl {
      display: grid;
      gap: 0.25rem;
      margin: 0;
    }
    .row {
      display: grid;
      grid-template-columns: 8rem minmax(0, 1fr);
      gap: 0.75rem;
      align-items: center;
      min-height: 2rem;
    }
    dt {
      display: flex;
      gap: 0.25rem;
    }
    dd {
      margin: 0;
    }
  `,
  template: `
    <app-modal
      [open]="shortcuts.helpOpen()"
      [title]="'shortcuts.title' | t"
      [width]="540"
      (closed)="shortcuts.helpOpen.set(false)"
    >
      @for (group of groups; track group.title) {
        <h3>{{ group.title | t }}</h3>
        <dl>
          @for (item of group.items; track item.label) {
            <div class="row">
              <dt>
                @for (key of item.keys; track key) {
                  <kbd>{{ key }}</kbd>
                }
              </dt>
              <dd>{{ item.label | t }}</dd>
            </div>
          }
        </dl>
      }
    </app-modal>
  `,
})
export class ShortcutsDialog {
  protected readonly shortcuts = inject(Shortcuts);
  protected readonly groups = GROUPS;
}
