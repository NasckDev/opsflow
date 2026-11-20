import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

/** Estado vazio: o que aconteceu e qual o próximo passo. Ações vão no conteúdo. */
@Component({
  selector: 'app-empty',
  imports: [NzEmptyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-empty
      [nzNotFoundContent]="content"
      [nzNotFoundImage]="image() === 'simple' ? 'simple' : 'default'"
    >
    </nz-empty>
    <ng-template #content>
      <div class="app-empty-text">
        <h2 class="app-empty-title">{{ title() }}</h2>
        @if (description()) {
          <p class="app-empty-description">{{ description() }}</p>
        }
        <div class="app-empty-actions"><ng-content /></div>
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem 1rem;
    }
    .app-empty-title {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 600;
    }
    .app-empty-description {
      margin: 0 auto;
      max-width: 28rem;
      color: var(--ox-color-text-muted);
    }
    .app-empty-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 1rem;
    }
    .app-empty-actions:empty {
      display: none;
    }
  `,
})
export class AppEmpty {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly image = input<'default' | 'simple'>('simple');
}
