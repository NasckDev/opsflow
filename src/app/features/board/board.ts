import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPreview,
  CdkDragStart,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MoneyPipe } from '../../core/i18n/format.pipes';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { RequestsStore } from '../../core/requests/requests.store';
import { TransitionService } from '../../core/requests/transition.service';
import { SessionStore } from '../../core/session/session.store';
import { ToastService } from '../../core/ui/toast.service';
import { BOARD_COLUMNS, actionForMove } from '../../domain/board';
import { RequestStatus, WorkflowRequest } from '../../domain/request.model';
import { TRANSITIONS, availableActions } from '../../domain/workflow-machine';
import { PriorityBadge } from '../../shared/badges';
import { Countdown } from '../../shared/countdown';
import { ViewportService } from '../../core/ui/viewport.service';
import {
  AppAvatar,
  AppButton,
  AppCard,
  AppDropdown,
  AppDropdownItem,
  AppIcon,
  AppPageHeader,
  AppResult,
  AppSkeleton,
  AppTab,
  AppTabs,
} from '../../ui';

interface Column {
  readonly status: RequestStatus;
  readonly items: readonly WorkflowRequest[];
}

const SKELETON_COLUMNS = [0, 1, 2, 3] as const;

@Component({
  selector: 'app-board',
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    CdkDragPreview,
    TranslatePipe,
    MoneyPipe,
    PriorityBadge,
    Countdown,
    AppAvatar,
    AppButton,
    AppCard,
    AppDropdown,
    AppIcon,
    AppPageHeader,
    AppResult,
    AppSkeleton,
    AppTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  private readonly store = inject(RequestsStore);
  private readonly session = inject(SessionStore);
  private readonly transitions = inject(TransitionService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);

  protected readonly viewport = inject(ViewportService);
  protected readonly status = this.store.status;
  protected readonly skeletons = SKELETON_COLUMNS;
  protected readonly dragging = signal<WorkflowRequest | null>(null);
  /** No celular só uma coluna aparece por vez, escolhida nas abas. */
  protected readonly mobileColumn = signal<RequestStatus>('in_review');

  protected readonly columns = computed<Column[]>(() => {
    const requests = this.store.requests();
    return BOARD_COLUMNS.map((status) => ({
      status,
      items: requests.filter((request) => request.status === status),
    }));
  });

  constructor() {
    this.store.load();
  }

  protected retry(): void {
    this.store.load(true);
  }

  protected setColumn(key: string): void {
    this.mobileColumn.set(key as RequestStatus);
  }

  /** Estados para onde o papel atual pode levar esta solicitação (alternativa ao arrastar). */
  protected targets(request: WorkflowRequest): RequestStatus[] {
    return availableActions(request, this.session.actor()).map((action) => TRANSITIONS[action].to);
  }

  /** Durante o arraste: a coluna aceita o movimento (regra do fluxo e permissão do papel)? */
  protected accepts(status: RequestStatus): boolean | null {
    const request = this.dragging();
    if (!request || request.status === status) return null;
    const action = actionForMove(request.status, status);
    return action !== null && this.transitions.blocker(request, action) === null;
  }

  protected onDragStart(event: CdkDragStart<WorkflowRequest>): void {
    this.dragging.set(event.source.data);
  }

  protected onDragEnd(): void {
    this.dragging.set(null);
  }

  protected onDrop(event: CdkDragDrop<RequestStatus, RequestStatus, WorkflowRequest>): void {
    this.dragging.set(null);
    const request = event.item.data;
    this.moveTo(request, event.container.data);
  }

  /** Alternativa ao arrastar: itens do menu "Mover para" (um por estado de destino). */
  protected moveItems(request: WorkflowRequest): AppDropdownItem[] {
    return this.targets(request).map((target) => ({
      key: target,
      label: this.i18n.translateDynamic(`status.${target}`),
    }));
  }

  protected onMoveItem(request: WorkflowRequest, key: string): void {
    this.moveTo(request, key as RequestStatus);
  }

  protected readonly tabs = computed<AppTab[]>(() => {
    this.i18n.locale();
    return this.columns().map((column) => ({
      key: column.status,
      label: this.i18n.translateDynamic(`status.${column.status}`),
      count: column.items.length,
    }));
  });

  private moveTo(request: WorkflowRequest, target: RequestStatus): void {
    if (request.status === target) return;
    const action = actionForMove(request.status, target);
    if (!action) {
      const message = this.i18n.translateDynamic('board.invalidMove', {
        from: this.i18n.translateDynamic(`status.${request.status}`),
        to: this.i18n.translateDynamic(`status.${target}`),
      });
      this.toast.show(message, 'error');
      return;
    }
    void this.transitions.act(request, action, { undoable: true });
  }
}
