import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/** Largura abaixo da qual o app usa o layout de celular (gaveta, barra inferior, cartões). */
export const MOBILE_QUERY = '(max-width: 959px)';

/** Abaixo desta largura, componentes largos (passos horizontais) passam para o modo vertical. */
export const COMPACT_QUERY = '(max-width: 1279px)';

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly breakpoints = inject(BreakpointObserver);
  readonly mobile = toSignal(
    this.breakpoints.observe(MOBILE_QUERY).pipe(map((state) => state.matches)),
    { initialValue: this.breakpoints.isMatched(MOBILE_QUERY) },
  );
  readonly compact = toSignal(
    this.breakpoints.observe(COMPACT_QUERY).pipe(map((state) => state.matches)),
    { initialValue: this.breakpoints.isMatched(COMPACT_QUERY) },
  );
}
