import { CATEGORIES, Category, PRIORITIES, Priority } from '../../../domain/request.model';

export const WIZARD_DRAFT_KEY = 'opsflow.wizard.draft';

export interface WizardDraftValue {
  readonly title: string;
  readonly description: string;
  readonly category: Category;
  readonly priority: Priority;
  readonly amount: number | null;
  readonly dueAt: string;
  readonly documents: string;
}

export interface WizardDraft {
  readonly savedAt: string;
  readonly step: number;
  readonly value: WizardDraftValue;
}

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' ? value.slice(0, max) : null;
}

/** O rascunho vem do armazenamento local (entrada não confiável): valida campo a campo. */
export function parseWizardDraft(raw: string | null): WizardDraft | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const { savedAt, step, value } = data as Record<string, unknown>;
  if (typeof savedAt !== 'string' || typeof step !== 'number') return null;
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  const title = text(v['title'], 200);
  const description = text(v['description'], 2000);
  const dueAt = text(v['dueAt'], 40);
  const documents = text(v['documents'], 2000);
  const category = CATEGORIES.find((item) => item === v['category']);
  const priority = PRIORITIES.find((item) => item === v['priority']);
  const amount = v['amount'];
  if (title === null || description === null || dueAt === null || documents === null) return null;
  if (!category || !priority) return null;
  if (amount !== null && (typeof amount !== 'number' || !Number.isFinite(amount))) return null;
  return {
    savedAt,
    step: Math.min(Math.max(Math.trunc(step), 0), 1),
    value: { title, description, category, priority, amount, dueAt, documents },
  };
}

/** Só vale guardar quando o usuário escreveu algo. */
export function isWorthSaving(value: WizardDraftValue): boolean {
  return (
    value.title.trim().length > 0 ||
    value.description.trim().length > 0 ||
    value.amount !== null ||
    value.documents.trim().length > 0
  );
}
