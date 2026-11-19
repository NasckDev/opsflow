import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Category, NewRequestInput, Priority } from '../../../domain/request.model';

const DAY_MS = 86_400_000;
export const TITLE_MIN_LENGTH = 5;

/** Rejeita datas no passado ou inválidas. */
export function futureDateValidator(control: AbstractControl<string>): ValidationErrors | null {
  const time = Date.parse(control.value);
  if (!control.value) return null;
  return Number.isNaN(time) || time <= Date.now() ? { pastDate: true } : null;
}

/** Valor aceito por `<input type="datetime-local">` no fuso local. */
export function toDateTimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function createWizardForm(now = new Date()) {
  const nonNullable = { nonNullable: true } as const;
  return new FormGroup({
    details: new FormGroup({
      title: new FormControl('', {
        ...nonNullable,
        validators: [Validators.required, Validators.minLength(TITLE_MIN_LENGTH)],
      }),
      description: new FormControl('', nonNullable),
      category: new FormControl<Category>('purchase', nonNullable),
      priority: new FormControl<Priority>('medium', nonNullable),
      amount: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0.01)],
      }),
    }),
    deadline: new FormGroup({
      dueAt: new FormControl(toDateTimeLocal(new Date(now.getTime() + 3 * DAY_MS)), {
        ...nonNullable,
        validators: [Validators.required, futureDateValidator],
      }),
      documents: new FormControl('', nonNullable),
    }),
  });
}

export type WizardForm = ReturnType<typeof createWizardForm>;

export function parseDocuments(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function toNewRequestInput(form: WizardForm): NewRequestInput {
  const { details, deadline } = form.getRawValue();
  return {
    title: details.title.trim(),
    description: details.description.trim(),
    category: details.category,
    priority: details.priority,
    amount: details.amount ?? 0,
    dueAt: new Date(deadline.dueAt).toISOString(),
    documents: parseDocuments(deadline.documents),
  };
}

export interface FieldError {
  readonly key: string;
  readonly params?: Readonly<Record<string, number>>;
}

/** Primeira mensagem de erro aplicável ao controle (ordem de prioridade fixa). */
export function firstError(control: AbstractControl): FieldError | null {
  const errors = control.errors;
  if (!errors) return null;
  if (errors['required']) return { key: 'wizard.error.required' };
  if (errors['minlength']) {
    return { key: 'wizard.error.minlength', params: { min: TITLE_MIN_LENGTH } };
  }
  if (errors['min']) return { key: 'wizard.error.min' };
  if (errors['pastDate']) return { key: 'wizard.error.pastDate' };
  return null;
}
