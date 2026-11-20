import { BreakpointObserver } from '@angular/cdk/layout';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, Injector, Type, inject, signal } from '@angular/core';
import { Subscription, filter } from 'rxjs';

const MOBILE_QUERY = '(max-width: 959px)';

/**
 * Painéis ancorados no topo (perfil, notificações): popover no desktop e
 * bottom sheet no celular. Esc e clique fora fecham e o foco volta ao gatilho.
 */
@Injectable({ providedIn: 'root' })
export class Popover {
  private readonly overlay = inject(Overlay);
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly injector = inject(Injector);

  private overlayRef: OverlayRef | null = null;
  private trigger: HTMLElement | null = null;
  private subscriptions = new Subscription();
  private readonly activeKey = signal<string | null>(null);

  /** Chave do painel aberto (ou null), para `aria-expanded` nos gatilhos. */
  readonly openKey = this.activeKey.asReadonly();

  toggle(trigger: HTMLElement, key: string, component: Type<unknown>): void {
    if (this.activeKey() === key) {
      this.close();
      return;
    }
    this.close(false);
    this.open(trigger, key, component);
  }

  /** Troca o painel aberto por outro, mantendo o mesmo gatilho (e o foco de volta a ele depois). */
  swap(key: string, component: Type<unknown>): void {
    const trigger = this.trigger;
    if (!trigger) return;
    this.close(false);
    this.open(trigger, key, component);
  }

  close(restoreFocus = true): void {
    if (!this.overlayRef) return;
    this.subscriptions.unsubscribe();
    this.overlayRef.dispose();
    this.overlayRef = null;
    this.activeKey.set(null);
    if (restoreFocus) this.trigger?.focus();
    this.trigger = null;
  }

  private open(trigger: HTMLElement, key: string, component: Type<unknown>): void {
    const mobile = this.breakpoints.isMatched(MOBILE_QUERY);
    this.trigger = trigger;
    this.subscriptions = new Subscription();
    const overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: mobile ? 'cdk-overlay-dark-backdrop' : 'cdk-overlay-transparent-backdrop',
      panelClass: mobile ? 'popover-sheet' : 'popover-floating',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: mobile
        ? this.overlay.position().global().bottom('0').centerHorizontally()
        : this.overlay
            .position()
            .flexibleConnectedTo(trigger)
            .withPositions([
              { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
              { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
            ])
            .withPush(true),
    });
    this.overlayRef = overlayRef;
    this.subscriptions.add(overlayRef.backdropClick().subscribe(() => this.close()));
    this.subscriptions.add(
      overlayRef
        .keydownEvents()
        .pipe(filter((event) => event.key === 'Escape'))
        .subscribe((event) => {
          event.preventDefault();
          this.close();
        }),
    );
    overlayRef.attach(new ComponentPortal(component, null, this.injector));
    this.activeKey.set(key);
  }
}
