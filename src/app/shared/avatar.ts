import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.avatar-lg]': 'size() === "lg"',
    '[class.avatar-sm]': 'size() === "sm"',
    '[style.--hue]': 'hue()',
    'aria-hidden': 'true',
  },
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: var(--nui-color-text);
      background: hsl(var(--hue) 70% 55% / 0.2);
      border: 1px solid hsl(var(--hue) 60% 55% / 0.45);
      user-select: none;
    }
    :host(.avatar-sm) {
      width: 1.375rem;
      height: 1.375rem;
      font-size: 0.5625rem;
    }
    :host(.avatar-lg) {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 0.875rem;
    }
  `,
  template: `{{ initials() }}`,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly hue = computed(() => hueOf(this.name()));
}
