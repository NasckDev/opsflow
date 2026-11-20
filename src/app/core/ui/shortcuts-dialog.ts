import { CdkTrapFocus } from '@angular/cdk/a11y';
import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from '../../shared/icon';
import { TranslatePipe } from '../i18n/translate.pipe';

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
  imports: [CdkTrapFocus, TranslatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .dialog-card {
      width: min(34rem, calc(100vw - 1.5rem));
      max-height: 85vh;
      overflow-y: auto;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    h3 {
      margin: var(--ox-space-4) 0 var(--ox-space-2);
      font-size: var(--ox-font-size-2xs);
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--ox-color-text-muted);
    }
    dl {
      display: grid;
      margin: 0;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ox-space-3);
      padding: var(--ox-space-2) 0;
      border-bottom: 1px solid var(--ox-hairline);
    }
    dt {
      order: 2;
      display: flex;
      gap: var(--ox-space-1);
    }
    dd {
      order: 1;
      margin: 0;
    }
    kbd {
      min-width: 1.5rem;
      padding: 0.125rem 0.4rem;
      text-align: center;
      font-family: var(--ox-font-family-mono);
      font-size: var(--ox-font-size-xs);
      background: var(--ox-page);
      border: 1px solid var(--ox-color-border);
      border-bottom-width: 2px;
      border-radius: var(--ox-radius-sm);
    }
  `,
  template: `
    <div
      class="dialog-card"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
    >
      <header>
        <h2 id="shortcuts-title">{{ 'shortcuts.title' | t }}</h2>
        <button
          type="button"
          class="btn btn-ghost btn-icon"
          [attr.aria-label]="'app.close' | t"
          (click)="ref.close()"
        >
          <app-icon name="x" />
        </button>
      </header>
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
    </div>
  `,
})
export class ShortcutsDialog {
  protected readonly ref = inject<DialogRef<void>>(DialogRef);
  protected readonly groups = GROUPS;
}
