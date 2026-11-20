import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  contentChild,
  input,
} from '@angular/core';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { AppIcon } from '../icon/app-icon';
import { UiIconName } from '../icons';
import { AppTone } from './app-tag';

export interface AppTimelineItem {
  readonly key: string;
  readonly tone: AppTone;
  readonly icon: UiIconName;
}

/** Linha do tempo. Modelo do conteúdo: `<ng-template let-item>…</ng-template>` (item = `data[i]`). */
@Component({
  selector: 'app-timeline',
  imports: [NzTimelineModule, NgTemplateOutlet, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-timeline>
      @for (entry of marks(); track entry.key; let index = $index) {
        <nz-timeline-item [nzDot]="dot">
          <ng-template #dot>
            <span class="app-timeline-dot app-tone app-tone-{{ entry.tone }}">
              <app-icon [name]="entry.icon" [size]="0.8125" />
            </span>
          </ng-template>
          <ng-container
            *ngTemplateOutlet="content(); context: { $implicit: data()[index], index: index }"
          />
        </nz-timeline-item>
      }
    </nz-timeline>
  `,
})
export class AppTimeline {
  readonly marks = input.required<readonly AppTimelineItem[]>();
  readonly data = input.required<readonly unknown[]>();
  protected readonly content = contentChild.required(TemplateRef);
}
