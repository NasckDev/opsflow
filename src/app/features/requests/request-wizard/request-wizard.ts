import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RequestsApi } from '../../../core/api/requests.api';
import { LocalDatePipe, MoneyPipe } from '../../../core/i18n/format.pipes';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../core/i18n/translation.service';
import { SessionStore } from '../../../core/session/session.store';
import { readStorage, writeStorage } from '../../../core/storage';
import { RequestsStore } from '../../../core/requests/requests.store';
import { Icon } from '../../../shared/icon';
import { CATEGORIES, PRIORITIES } from '../../../domain/request.model';
import {
  FieldError,
  createWizardForm,
  firstError,
  parseDocuments,
  toNewRequestInput,
} from './wizard-form';
import {
  WIZARD_DRAFT_KEY,
  WizardDraft,
  WizardDraftValue,
  isWorthSaving,
  parseWizardDraft,
} from './wizard-draft';

const AUTOSAVE_DEBOUNCE_MS = 500;

const STEPS = ['wizard.step.details', 'wizard.step.deadline', 'wizard.step.review'] as const;

@Component({
  selector: 'app-request-wizard',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MoneyPipe, LocalDatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-wizard.html',
  styleUrl: './request-wizard.scss',
})
export class RequestWizard {
  private readonly api = inject(RequestsApi);
  private readonly router = inject(Router);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly i18n = inject(TranslationService);
  private readonly injector = inject(Injector);
  protected readonly session = inject(SessionStore);

  private readonly store = inject(RequestsStore);
  protected readonly restored = signal<WizardDraft | null>(null);
  protected readonly savedAt = signal<string | null>(null);

  protected readonly steps = STEPS;
  protected readonly categories = CATEGORIES;
  protected readonly priorities = PRIORITIES;
  protected readonly form = createWizardForm();
  protected readonly step = signal(0);
  protected readonly saving = signal(false);
  protected readonly saveError = signal(false);
  protected readonly errorCount = signal(0);
  protected readonly isLastStep = computed(() => this.step() === STEPS.length - 1);

  private readonly stepPanel = viewChild.required<ElementRef<HTMLElement>>('stepPanel');

  constructor() {
    this.restoreDraft();
    this.form.valueChanges
      .pipe(debounceTime(AUTOSAVE_DEBOUNCE_MS), takeUntilDestroyed())
      .subscribe(() => this.persistDraft());
  }

  /** Descarta o rascunho restaurado e volta ao formulário em branco. */
  protected discardDraft(): void {
    writeStorage(WIZARD_DRAFT_KEY, '');
    this.restored.set(null);
    this.savedAt.set(null);
    this.form.reset(createWizardForm().getRawValue());
    this.step.set(0);
  }

  private restoreDraft(): void {
    const draft = parseWizardDraft(readStorage(WIZARD_DRAFT_KEY));
    if (!draft) return;
    const { value } = draft;
    this.form.patchValue({
      details: {
        title: value.title,
        description: value.description,
        category: value.category,
        priority: value.priority,
        amount: value.amount,
      },
      deadline: { dueAt: value.dueAt, documents: value.documents },
    });
    this.step.set(draft.step);
    this.restored.set(draft);
    this.savedAt.set(draft.savedAt);
  }

  private persistDraft(): void {
    const { details, deadline } = this.form.getRawValue();
    const value: WizardDraftValue = { ...details, dueAt: deadline.dueAt, documents: deadline.documents };
    if (!isWorthSaving(value)) {
      writeStorage(WIZARD_DRAFT_KEY, '');
      this.savedAt.set(null);
      return;
    }
    const savedAt = new Date().toISOString();
    writeStorage(
      WIZARD_DRAFT_KEY,
      JSON.stringify({ savedAt, step: Math.min(this.step(), 1), value }),
    );
    this.savedAt.set(savedAt);
  }

  protected error(control: AbstractControl): FieldError | null {
    return control.touched ? firstError(control) : null;
  }

  protected documents(): string[] {
    return parseDocuments(this.form.controls.deadline.controls.documents.value);
  }

  protected review(): ReturnType<typeof toNewRequestInput> {
    return toNewRequestInput(this.form);
  }

  protected next(): void {
    if (!this.validateCurrentStep()) return;
    this.goTo(this.step() + 1);
  }

  protected back(): void {
    this.goTo(this.step() - 1);
  }

  protected save(submit: boolean): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set(false);
    this.api
      .create({ input: toNewRequestInput(this.form), actor: this.session.actor(), submit })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (created) => {
          writeStorage(WIZARD_DRAFT_KEY, '');
          this.store.upsert(created);
          this.announcer.announce(this.i18n.translate('wizard.saved', { code: created.code }));
          void this.router.navigate(['/requests', created.id]);
        },
        error: () => {
          this.saveError.set(true);
          this.announcer.announce(this.i18n.translate('wizard.saveError'), 'assertive');
        },
      });
  }

  private currentGroup() {
    const groups = [this.form.controls.details, this.form.controls.deadline] as const;
    const index = this.step();
    return index < groups.length ? groups[index] : null;
  }

  /** Marca a etapa, anuncia o resumo de erros e move o foco ao primeiro inválido. */
  private validateCurrentStep(): boolean {
    const group = this.currentGroup();
    if (!group || group.valid) {
      this.errorCount.set(0);
      return true;
    }
    group.markAllAsTouched();
    const controls: AbstractControl[] = Object.values(group.controls);
    const count = controls.filter((control) => control.invalid).length;
    this.errorCount.set(count);
    this.announcer.announce(this.i18n.translate('wizard.errorsSummary', { count }), 'assertive');
    this.afterRender(() =>
      this.stepPanel().nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
    );
    return false;
  }

  private goTo(index: number): void {
    this.step.set(Math.min(Math.max(index, 0), STEPS.length - 1));
    this.afterRender(() =>
      this.stepPanel().nativeElement.querySelector<HTMLElement>('h2')?.focus(),
    );
  }

  private afterRender(callback: () => void): void {
    afterNextRender(callback, { injector: this.injector });
  }
}
