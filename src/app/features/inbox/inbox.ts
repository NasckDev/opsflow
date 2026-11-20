import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LocalDatePipe, MoneyPipe } from '../../core/i18n/format.pipes';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { RequestsStore } from '../../core/requests/requests.store';
import { TransitionService } from '../../core/requests/transition.service';
import { SessionStore } from '../../core/session/session.store';
import { readStorage, writeStorage } from '../../core/storage';
import { NowService } from '../../core/time/now.service';
import { isTypingTarget } from '../../core/ui/shortcuts.service';
import { ToastService } from '../../core/ui/toast.service';
import { InboxTask, canBatchApprove, inboxTasks } from '../../domain/inbox';
import { CATEGORIES, PRIORITIES, WorkflowAction } from '../../domain/request.model';
import { Avatar } from '../../shared/avatar';
import { Countdown } from '../../shared/countdown';
import { PriorityBadge, StatusBadge } from '../../shared/badges';
import { Icon, IconName } from '../../shared/icon';
import {
  InboxFilter,
  NO_FILTER,
  PRESET_FILTERS,
  SAVED_FILTERS_KEY,
  SavedFilter,
  addSavedFilter,
  applyInboxFilter,
  parseSavedFilters,
  sameFilter,
} from './inbox-filters';

const ACTION_ICONS: Readonly<Record<WorkflowAction, IconName>> = {
  submit: 'send',
  resubmit: 'send',
  return: 'undo',
  approve: 'checkCircle',
  reject: 'xCircle',
  complete: 'check',
};

const BUTTON_CLASSES: Readonly<Record<WorkflowAction, string>> = {
  submit: 'btn-primary',
  resubmit: 'btn-primary',
  complete: 'btn-primary',
  approve: 'btn-success',
  reject: 'btn-danger',
  return: '',
};

const SKELETONS = [0, 1, 2, 3, 4] as const;

@Component({
  selector: 'app-inbox',
  imports: [
    RouterLink,
    TranslatePipe,
    LocalDatePipe,
    MoneyPipe,
    Avatar,
    Countdown,
    PriorityBadge,
    StatusBadge,
    Icon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
  templateUrl: './inbox.html',
  styleUrl: './inbox.scss',
})
export class Inbox {
  private readonly store = inject(RequestsStore);
  private readonly session = inject(SessionStore);
  private readonly transitions = inject(TransitionService);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly clock = inject(NowService);

  protected readonly presets = PRESET_FILTERS;
  protected readonly priorities = PRIORITIES;
  protected readonly categories = CATEGORIES;
  protected readonly skeletons = SKELETONS;
  protected readonly status = this.store.status;
  protected readonly role = this.session.currentRole;
  protected readonly actionIcons = ACTION_ICONS;

  protected readonly filter = signal<InboxFilter>(NO_FILTER);
  protected readonly saved = signal<readonly SavedFilter[]>(
    parseSavedFilters(readStorage(SAVED_FILTERS_KEY)),
  );
  protected readonly naming = signal(false);
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly focusIndex = signal(0);
  protected readonly busy = signal(false);

  protected readonly allTasks = computed(() =>
    inboxTasks(this.store.requests(), this.session.actor(), this.clock.now()),
  );
  protected readonly tasks = computed(() => applyInboxFilter(this.allTasks(), this.filter()));
  protected readonly selectedTasks = computed(() =>
    this.tasks().filter((task) => this.selected().has(task.request.id)),
  );
  protected readonly batchable = computed(() => this.selectedTasks().filter(canBatchApprove));
  protected readonly isCustomFilter = computed(
    () =>
      !PRESET_FILTERS.some((preset) => sameFilter(preset.filter, this.filter())) &&
      !this.saved().some((item) => sameFilter(item.filter, this.filter())),
  );

  constructor() {
    this.store.load();
  }

  protected buttonClass(action: WorkflowAction): string {
    return BUTTON_CLASSES[action];
  }

  protected isBatchable(task: InboxTask): boolean {
    return canBatchApprove(task);
  }

  protected isActive(filter: InboxFilter): boolean {
    return sameFilter(filter, this.filter());
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  protected applyFilter(filter: InboxFilter): void {
    this.filter.set(filter);
    this.focusIndex.set(0);
  }

  protected patchFilter(patch: Partial<InboxFilter>): void {
    this.filter.update((current) => ({ ...current, ...patch }));
    this.focusIndex.set(0);
  }

  protected onPriority(event: Event): void {
    this.patchFilter({ priority: (event.target as HTMLSelectElement).value as InboxFilter['priority'] });
  }

  protected onCategory(event: Event): void {
    this.patchFilter({ category: (event.target as HTMLSelectElement).value as InboxFilter['category'] });
  }

  protected saveFilter(name: string): void {
    this.saved.update((current) => addSavedFilter(current, name, this.filter()));
    writeStorage(SAVED_FILTERS_KEY, JSON.stringify(this.saved()));
    this.naming.set(false);
  }

  protected removeFilter(id: string): void {
    this.saved.update((current) => current.filter((item) => item.id !== id));
    writeStorage(SAVED_FILTERS_KEY, JSON.stringify(this.saved()));
  }

  protected toggle(id: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected toggleAll(checked: boolean): void {
    const ids = this.tasks().filter((task) => this.isBatchable(task)).map((task) => task.request.id);
    this.selected.set(checked ? new Set(ids) : new Set());
  }

  protected retry(): void {
    this.store.load(true);
  }

  protected async act(task: InboxTask, action: WorkflowAction): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.transitions.act(task.request, action);
      this.selected.update((current) => {
        const next = new Set(current);
        next.delete(task.request.id);
        return next;
      });
    } finally {
      this.busy.set(false);
    }
  }

  protected async approveSelected(): Promise<void> {
    const batch = this.batchable();
    if (this.busy() || batch.length === 0) return;
    this.busy.set(true);
    let done = 0;
    try {
      for (const task of batch) {
        const outcome = await this.transitions.act(task.request, 'approve', undefined, true);
        if (outcome.request) done += 1;
      }
    } finally {
      this.busy.set(false);
      this.selected.set(new Set());
    }
    this.toast.show(
      this.i18n.translateDynamic('inbox.batchDone', { count: done }),
      done === batch.length ? 'success' : 'error',
    );
  }

  /** Atalhos da caixa de entrada: j/k, Enter, x, a, r. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target) || this.dialog.openDialogs.length > 0) return;
    const list = this.tasks();
    if (list.length === 0) return;
    const index = Math.min(this.focusIndex(), list.length - 1);
    const current = list[index];
    switch (event.key) {
      case 'j':
        this.moveFocus(Math.min(index + 1, list.length - 1));
        break;
      case 'k':
        this.moveFocus(Math.max(index - 1, 0));
        break;
      case 'Enter':
        if (event.target instanceof HTMLElement && event.target.closest('a,button')) return;
        void this.router.navigate(['/requests', current.request.id]);
        break;
      case 'x':
        if (this.isBatchable(current)) this.toggle(current.request.id);
        break;
      case 'a':
        if (current.actions.includes('approve')) void this.act(current, 'approve');
        break;
      case 'r':
        if (current.actions.includes('reject')) void this.act(current, 'reject');
        else if (current.actions.includes('return')) void this.act(current, 'return');
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  private moveFocus(index: number): void {
    this.focusIndex.set(index);
    const id = this.tasks()[index]?.request.id;
    queueMicrotask(() =>
      document.getElementById(`task-${id}`)?.scrollIntoView({ block: 'nearest' }),
    );
  }
}
