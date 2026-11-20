import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AppBreadcrumb, AppBreadcrumbItem } from '../nav/app-breadcrumb';

/** Cabeçalho de página: trilha, título (h1), subtítulo e ações (`[appPageActions]`). */
@Component({
  selector: 'app-page-header',
  imports: [AppBreadcrumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-page-header">
      @if (breadcrumb().length > 1) {
        <app-breadcrumb [items]="breadcrumb()" />
      }
      <div class="app-page-header-row">
        <div class="app-page-header-text">
          <h1 [id]="titleId()" tabindex="-1">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="app-page-subtitle">{{ subtitle() }}</p>
          }
        </div>
        <div class="app-page-actions"><ng-content select="[appPageActions]" /></div>
      </div>
      <ng-content />
    </header>
  `,
  styles: `
    :host {
      display: block;
    }
    .app-page-header-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.75rem 1rem;
      margin-top: 0.25rem;
    }
    h1 {
      margin: 0;
      font-size: 1.375rem;
      font-weight: 600;
      line-height: 1.25;
      letter-spacing: -0.01em;
    }
    .app-page-subtitle {
      margin: 0.25rem 0 0;
      color: var(--ox-color-text-muted);
    }
    .app-page-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  `,
})
export class AppPageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly titleId = input('page-title');
  readonly breadcrumb = input<readonly AppBreadcrumbItem[]>([]);
}
