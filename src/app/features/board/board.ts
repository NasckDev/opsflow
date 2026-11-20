import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPreview,
  CdkDragStart,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { Avatar } from '../../shared/avatar';
import { PriorityBadge } from '../../shared/badges';
import { Countdown } from '../../shared/countdown';
import { Icon } from '../../shared/icon';

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
    RouterLink,
    TranslatePipe,
    MoneyPipe,
    Avatar,
    PriorityBadge,
    Countdown,
    Icon,
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

  protected readonly status = this.store.status;
  protected readonly skeletons = SKELETON_COLUMNS;
  protected readonly dragging = signal<WorkflowRequest | null>(null);

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

  protected onMoveSelect(request: WorkflowRequest, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const target = select.value as RequestStatus;
    select.value = '';
    if (target) this.moveTo(request, target);
  }

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
    void this.transitions.act(request, action);
  }
}
