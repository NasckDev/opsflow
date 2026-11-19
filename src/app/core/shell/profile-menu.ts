import { BreakpointObserver } from '@angular/cdk/layout';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { Subscription, filter } from 'rxjs';
import { ProfilePanel } from './profile-panel';

const MOBILE_QUERY = '(max-width: 959px)';

/**
 * Abre o painel "Perfil de demonstração" como popover ancorado (desktop) ou
 * bottom sheet (celular). Esc e clique fora fecham e o foco volta ao gatilho.
 */
@Injectable({ providedIn: 'root' })
export class ProfileMenu {
  private readonly overlay = inject(Overlay);
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly injector = inject(Injector);

  private overlayRef: OverlayRef | null = null;
  private trigger: HTMLElement | null = null;
  private subscriptions = new Subscription();
  private readonly opened = signal(false);

  readonly isOpen = this.opened.asReadonly();

  toggle(trigger: HTMLElement): void {
    if (this.overlayRef) {
      this.close();
    } else {
      this.open(trigger);
    }
  }

  close(): void {
    if (!this.overlayRef) return;
    this.subscriptions.unsubscribe();
    this.overlayRef.dispose();
    this.overlayRef = null;
    this.opened.set(false);
    this.trigger?.focus();
    this.trigger = null;
  }

  private open(trigger: HTMLElement): void {
    const mobile = this.breakpoints.isMatched(MOBILE_QUERY);
    this.trigger = trigger;
    this.subscriptions = new Subscription();
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: mobile ? 'cdk-overlay-dark-backdrop' : 'cdk-overlay-transparent-backdrop',
      panelClass: mobile ? 'profile-sheet' : 'profile-popover',
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
    this.subscriptions.add(this.overlayRef.backdropClick().subscribe(() => this.close()));
    this.subscriptions.add(
      this.overlayRef
        .keydownEvents()
        .pipe(filter((event) => event.key === 'Escape'))
        .subscribe((event) => {
          event.preventDefault();
          this.close();
        }),
    );
    this.overlayRef.attach(new ComponentPortal(ProfilePanel, null, this.injector));
    this.opened.set(true);
  }
}
