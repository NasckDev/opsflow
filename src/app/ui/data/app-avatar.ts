import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NzAvatarComponent } from 'ng-zorro-antd/avatar';

const HUES = 360;

/** Iniciais (primeira e última palavra) de um nome. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Matiz estável derivado do nome: a mesma pessoa tem sempre a mesma cor. */
export function hueOf(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % HUES;
  return hash;
}

export type AppAvatarSize = 'small' | 'default' | 'large';

/** Avatar com iniciais coloridas (ou imagem, com `src`). Decorativo: o nome fica ao lado. */
@Component({
  selector: 'app-avatar',
  imports: [NzAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--hue]': 'hue()', 'aria-hidden': 'true', class: 'app-avatar' },
  template: `<nz-avatar
    [nzText]="initials()"
    [nzSrc]="src() || undefined"
    [nzSize]="size()"
  ></nz-avatar>`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class AppAvatar {
  readonly name = input.required<string>();
  readonly size = input<AppAvatarSize>('default');
  readonly src = input('');
  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly hue = computed(() => hueOf(this.name()));
}
