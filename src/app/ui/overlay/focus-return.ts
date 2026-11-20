import { DestroyRef, Signal, effect, inject, untracked } from '@angular/core';

/**
 * Devolve o foco a quem abriu o diálogo ou a gaveta: guarda o elemento ativo quando `open`
 * vira verdadeiro e o refocaliza quando fecha (ou quando o componente é destruído).
 */
export function useFocusReturn(open: Signal<boolean>): void {
  let origin: HTMLElement | null = null;
  const restore = (): void => {
    const target = origin;
    origin = null;
    if (target?.isConnected) setTimeout(() => target.focus({ preventScroll: true }), 0);
  };
  effect(() => {
    const isOpen = open();
    untracked(() => {
      if (isOpen) origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      else restore();
    });
  });
  inject(DestroyRef).onDestroy(restore);
}
