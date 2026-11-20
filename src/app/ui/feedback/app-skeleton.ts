import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NzSkeletonComponent } from 'ng-zorro-antd/skeleton';

/** Esqueleto de carregamento com texto para leitor de tela (`role="status"`). */
@Component({
  selector: 'app-skeleton',
  imports: [NzSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="status">
      <span class="visually-hidden">{{ label() }}</span>
      <div aria-hidden="true">
        @for (item of items(); track item) {
          <nz-skeleton
            [nzActive]="active()"
            [nzAvatar]="avatar()"
            [nzTitle]="title()"
            [nzParagraph]="{ rows: rows() }"
          ></nz-skeleton>
        }
      </div>
    </div>
  `,
})
export class AppSkeleton {
  readonly label = input('Carregando…');
  readonly rows = input(2);
  readonly count = input(1);
  readonly avatar = input(false);
  readonly title = input(true);
  readonly active = input(true);
  protected readonly items = computed(() =>
    Array.from({ length: this.count() }, (_, index) => index),
  );
}
