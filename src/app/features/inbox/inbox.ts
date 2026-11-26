import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MoneyPipe, ShortDatePipe } from '../../core/i18n/format.pipes';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { RequestsStore } from '../../core/requests/requests.store';
import { TransitionService } from '../../core/requests/transition.service';
import { SessionStore } from '../../core/session/session.store';
import { ShellPanels } from '../../core/shell/panels';
import { readStorage, writeStorage } from '../../core/storage';
import { NowService } from '../../core/time/now.service';
import { ToastService } from '../../core/ui/toast.service';
import { Shortcuts, isTypingTarget } from '../../core/ui/shortcuts.service';
import { ViewportService } from '../../core/ui/viewport.service';
import { buildApprovalChain } from '../../domain/approval-chain';
import { InboxTask, canBatchApprove, inboxTasks } from '../../domain/inbox';
import { evaluateSla } from '../../domain/sla';
import { CATEGORIES, PRIORITIES, WorkflowAction } from '../../domain/request.model';
import { ACTION_BUTTON, ACTION_ICONS } from '../../shared/action-meta';
import { ApprovalChainList } from '../../shared/approval-chain-list';
import { PriorityBadge, StatusBadge } from '../../shared/badges';
import { Countdown } from '../../shared/countdown';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppCheckbox,
  AppEmpty,
  AppIcon,
  AppIconButton,
  AppInput,
  AppPageHeader,
  AppProgress,
  AppResult,
  AppSelect,
  AppSelectOption,
  AppSkeleton,
  AppTag,
} from '../../ui';
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

const SKELETONS = [0, 1, 2, 3, 4] as const;
const HINT_KEY = 'opsflow.inbox.hint.dismissed';

interface BatchProgress {
  readonly done: number;
  readonly total: number;
}

interface SkippedItem {
  readonly code: string;
  readonly reason: 'overdue' | 'failed';
}

interface BatchResult {
  readonly approved: number;
  readonly skipped: readonly SkippedItem[];
}

@Component({
  selector: 'app-inbox',
  imports: [
    FormsModule,
    TranslatePipe,
    MoneyPipe,
    ShortDatePipe,
    AppAlert,
    AppButton,
    AppCard,
    AppCheckbox,
    AppEmpty,
    AppIcon,
    AppIconButton,
    AppInput,
    AppPageHeader,
    AppProgress,
    AppResult,
    AppSelect,
    AppSkeleton,
    AppTag,
    ApprovalChainList,
    Countdown,
    PriorityBadge,
    StatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
    '(document:pointerdown)': 'keyboardMode.set(false)',
  },
  templateUrl: './inbox.html',
  styleUrl: './inbox.scss',
})
export class Inbox {
  private readonly store = inject(RequestsStore);
  private readonly session = inject(SessionStore);
  private readonly transitions = inject(TransitionService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(Shortcuts);
  private readonly panels = inject(ShellPanels);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslationService);
  private readonly clock = inject(NowService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly viewport = inject(ViewportService);

  protected readonly presets = PRESET_FILTERS;
  protected readonly priorities = PRIORITIES;
  protected readonly categories = CATEGORIES;
  protected readonly skeletons = SKELETONS;
  protected readonly status = this.store.status;
  protected readonly role = this.session.currentRole;
  protected readonly actionIcons = ACTION_ICONS;
  protected readonly actionButton = ACTION_BUTTON;
  protected readonly canSeeAudit = computed(() => this.session.can('audit.view'));

  protected readonly filter = signal<InboxFilter>(NO_FILTER);
  protected readonly saved = signal<readonly SavedFilter[]>(
    parseSavedFilters(readStorage(SAVED_FILTERS_KEY)),
  );
  protected readonly naming = signal(false);
  protected readonly filterName = signal('');
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly busy = signal(false);
  protected readonly hintVisible = signal(readStorage(HINT_KEY) !== '1');

  /** Foco de teclado (j/k): ancorado no id; o contorno só aparece depois da primeira tecla. */
  protected readonly focusId = signal<string | null>(null);
  protected readonly keyboardMode = signal(false);
  private lastIndex = 0;

  protected readonly batch = signal<BatchProgress | null>(null);
  protected readonly batchResult = signal<BatchResult | null>(null);

  protected readonly everything = computed(() =>
    inboxTasks(this.store.requests(), this.session.actor(), this.clock.now()),
  );
  protected readonly toConclude = computed(
    () => this.everything().filter((task) => task.stage === 'conclude').length,
  );
  protected readonly todoCount = computed(
    () => this.everything().filter((task) => task.stage === 'todo').length,
  );
  protected readonly tasks = computed(() => applyInboxFilter(this.everything(), this.filter()));
  protected readonly selectedTasks = computed(() =>
    this.tasks().filter((task) => this.selected().has(task.request.id)),
  );
  /** Das selecionadas, as que ainda aprovam direto (o relógio pode ter estourado o SLA de alguma). */
  protected readonly eligible = computed(() => this.selectedTasks().filter(canBatchApprove));
  protected readonly willSkip = computed(
    () => this.selectedTasks().length - this.eligible().length,
  );
  /** Todas as tarefas que aprovam direto estão marcadas (e há ao menos uma). */
  protected readonly allSelected = computed(() => {
    const ready = this.tasks().filter((task) => canBatchApprove(task));
    return ready.length > 0 && ready.every((task) => this.selected().has(task.request.id));
  });
  protected readonly isCustomFilter = computed(
    () =>
      !PRESET_FILTERS.some((preset) => sameFilter(preset.filter, this.filter())) &&
      !this.saved().some((item) => sameFilter(item.filter, this.filter())),
  );

  /** Quantas tarefas cada recorte mostraria agora (contadores das abas). */
  protected readonly presetCounts = computed(() => {
    const all = this.everything();
    return new Map(PRESET_FILTERS.map((preset) => [preset.id, applyInboxFilter(all, preset.filter).length]));
  });

  /** Soma dos valores selecionados (só exibição, para conferir o lote antes de aprovar). */
  protected readonly selectedTotal = computed(() =>
    this.selectedTasks().reduce((sum, task) => sum + task.request.amount, 0),
  );

  /** Tarefa em foco: a do id; se ela saiu da lista, a que ocupa o mesmo lugar. */
  protected readonly activeId = computed(() => {
    const list = this.tasks();
    if (list.length === 0) return null;
    const byId = list.find((task) => task.request.id === this.focusId());
    return (byId ?? list[Math.min(this.lastIndex, list.length - 1)]).request.id;
  });

  /** A tarefa em foco é a que aparece no painel de detalhe. */
  protected readonly activeTask = computed(
    () => this.tasks().find((task) => task.request.id === this.activeId()) ?? null,
  );
  protected readonly activeChain = computed(() => {
    const task = this.activeTask();
    return task ? buildApprovalChain(task.request) : [];
  });
  /** As três últimas entradas da auditoria, da mais antiga para a mais nova. */
  protected readonly recentAudit = computed(() => this.activeTask()?.request.audit.slice(-3) ?? []);

  constructor() {
    this.store.load();
  }

  /** Mostra a tarefa no painel de detalhe; no celular, rola até ele (fica abaixo da tabela). */
  protected show(task: InboxTask, reveal = false): void {
    this.lastIndex = Math.max(
      0,
      this.tasks().findIndex((item) => item.request.id === task.request.id),
    );
    this.focusId.set(task.request.id);
    if (reveal && this.viewport.mobile()) {
      queueMicrotask(() =>
        document.getElementById('inbox-detail')?.scrollIntoView({ block: 'start' }),
      );
    }
  }

  protected isBatchable(task: InboxTask): boolean {
    return canBatchApprove(task);
  }

  protected needsJustification(task: InboxTask): boolean {
    return task.actions.includes('approve') && !canBatchApprove(task);
  }

  protected dismissHint(): void {
    this.hintVisible.set(false);
    writeStorage(HINT_KEY, '1');
  }

  protected isActive(filter: InboxFilter): boolean {
    return sameFilter(filter, this.filter());
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  protected applyFilter(filter: InboxFilter): void {
    this.filter.set(filter);
    this.selected.set(new Set());
    this.focusId.set(null);
    this.lastIndex = 0;
  }

  protected patchFilter(patch: Partial<InboxFilter>): void {
    this.applyFilter({ ...this.filter(), ...patch });
  }

  protected onPriority(value: string | number | null): void {
    this.patchFilter({ priority: (value ?? 'any') as InboxFilter['priority'] });
  }

  protected onCategory(value: string | number | null): void {
    this.patchFilter({ category: (value ?? 'any') as InboxFilter['category'] });
  }

  protected readonly priorityOptions = computed<AppSelectOption[]>(() => {
    this.i18n.locale();
    const t = (key: string) => this.i18n.translateDynamic(key);
    return [
      { value: 'any', label: t('inbox.anyPriority') },
      ...PRIORITIES.map((item) => ({ value: item, label: t(`priority.${item}`) })),
    ];
  });

  protected readonly categoryOptions = computed<AppSelectOption[]>(() => {
    this.i18n.locale();
    const t = (key: string) => this.i18n.translateDynamic(key);
    return [
      { value: 'any', label: t('inbox.anyCategory') },
      ...CATEGORIES.map((item) => ({ value: item, label: t(`category.${item}`) })),
    ];
  });

  protected saveFilter(name: string | number | null): void {
    const label = String(name ?? '').trim();
    if (!label) return;
    this.saved.update((current) => addSavedFilter(current, label, this.filter()));
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
    const ids = this.tasks()
      .filter((task) => this.isBatchable(task))
      .map((task) => task.request.id);
    this.selected.set(checked ? new Set(ids) : new Set());
  }

  protected retry(): void {
    this.store.load(true);
  }

  /** Decisão avulsa: sai da caixa na hora e pode ser desfeita durante alguns segundos. */
  protected async act(task: InboxTask, action: WorkflowAction): Promise<void> {
    const index = this.tasks().findIndex((item) => item.request.id === task.request.id);
    const outcome = await this.transitions.act(task.request, action, { undoable: true });
    if (!outcome.request) return;
    this.selected.update((current) => {
      const next = new Set(current);
      next.delete(task.request.id);
      return next;
    });
    this.lastIndex = Math.max(0, index);
    this.focusId.set(null);
    this.announceFocus();
  }

  /**
   * Aprovação em lote: congela a seleção no clique, aprova em paralelo, mostra o
   * progresso e lista o que foi pulado (SLA que estourou no meio vira "pulado").
   */
  protected async approveSelected(): Promise<void> {
    if (this.batch()) return;
    const now = new Date(); // relógio de verdade no clique, não o do último tique
    const chosen = this.selectedTasks();
    const ready = chosen.filter((task) =>
      canBatchApprove({ ...task, sla: evaluateSla(task.request, now) }),
    );
    const skipped: SkippedItem[] = chosen
      .filter((task) => !ready.includes(task))
      .map((task) => ({ code: task.request.code, reason: 'overdue' as const }));
    this.batchResult.set(null);
    if (ready.length === 0) {
      this.finishBatch(0, skipped);
      return;
    }
    this.batch.set({ done: 0, total: ready.length });
    let approved = 0;
    await Promise.all(
      ready.map(async (task) => {
        const outcome = await this.transitions.act(task.request, 'approve', {
          quiet: true,
          prompt: false,
        });
        if (outcome.request) approved += 1;
        else
          skipped.push({
            code: task.request.code,
            reason: outcome.error === 'justification_required' ? 'overdue' : 'failed',
          });
        this.batch.update((current) =>
          current ? { ...current, done: current.done + 1 } : current,
        );
      }),
    );
    this.finishBatch(approved, skipped);
  }

  protected dismissBatchResult(): void {
    this.batchResult.set(null);
  }

  /** Atalhos da caixa de entrada: j/k, Enter, x, a, r (ancorados no id da tarefa em foco). */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target) || this.shortcuts.dialogOpen()) return;
    if (this.panels.openKey() !== null || this.batch() !== null) return;
    const list = this.tasks();
    if (list.length === 0) return;
    const id = this.activeId();
    const index = list.findIndex((task) => task.request.id === id);
    const current = list[Math.max(0, index)];
    switch (event.key) {
      case 'j':
        this.moveFocus(Math.min(index + 1, list.length - 1));
        break;
      case 'k':
        this.moveFocus(Math.max(index - 1, 0));
        break;
      case 'Enter':
        // No título da linha, Enter abre a solicitação completa (o clique só mostra o detalhe).
        if (
          event.target instanceof HTMLElement &&
          event.target.closest('a,button') &&
          !event.target.closest('button.title')
        ) {
          return;
        }
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

  private finishBatch(approved: number, skipped: readonly SkippedItem[]): void {
    this.batch.set(null);
    this.selected.set(new Set());
    this.batchResult.set({ approved, skipped });
    const summary = this.i18n.translateDynamic('inbox.batchSummary', {
      approved,
      skipped: skipped.length,
      remaining: this.todoCount(),
    });
    this.toast.show(summary, skipped.length === 0 ? 'success' : 'info');
    this.announcer.announce(summary);
  }

  private moveFocus(index: number): void {
    const list = this.tasks();
    const target = list[index];
    if (!target) return;
    this.lastIndex = index;
    this.focusId.set(target.request.id);
    this.keyboardMode.set(true);
    queueMicrotask(() => document.getElementById(`open-${target.request.id}`)?.focus());
    this.announcer.announce(`${target.request.code} ${target.request.title}`);
  }

  /** Depois de uma decisão o foco passa para a próxima tarefa e é anunciado. */
  private announceFocus(): void {
    queueMicrotask(() => {
      const id = this.activeId();
      const task = this.tasks().find((item) => item.request.id === id);
      if (!task) return;
      this.announcer.announce(
        this.i18n.translateDynamic('inbox.focusOn', { code: task.request.code }),
      );
    });
  }
}
