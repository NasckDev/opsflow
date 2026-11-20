import { sanitizeDocumentName } from '../../domain/comments';
import {
  CATEGORIES,
  NewRequestInput,
  PRIORITIES,
  REQUEST_STATUSES,
  RequestStatus,
  ROLES,
  Actor,
  Result,
  WORKFLOW_ACTIONS,
  WorkflowAction,
  fail,
  ok,
} from '../../domain/request.model';

export const TITLE_MIN = 5;
export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 2000;
export const AMOUNT_MAX = 1_000_000_000;
export const DOCUMENTS_MAX = 20;
export const COMMENT_BODY_MAX = 1000;

export type InputError = 'invalid_input';

type Raw = Readonly<Record<string, unknown>>;

function record(value: unknown): Raw | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Raw)
    : null;
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | null {
  return list.find((item) => item === value) ?? null;
}

/** Ator vindo dos cabeçalhos da requisição (nome codificado em URI). */
export function parseActor(name: string | null, role: string | null): Actor | null {
  const parsedRole = oneOf(ROLES, role);
  if (!name || !parsedRole) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(name).trim();
  } catch {
    return null;
  }
  return decoded.length > 0 && decoded.length <= 80 ? { name: decoded, role: parsedRole } : null;
}

export function parseNewRequestInput(raw: unknown): Result<NewRequestInput, InputError> {
  const data = record(raw);
  if (!data) return fail('invalid_input');
  const title = typeof data['title'] === 'string' ? data['title'].trim() : '';
  const description = typeof data['description'] === 'string' ? data['description'].trim() : '';
  const category = oneOf(CATEGORIES, data['category']);
  const priority = oneOf(PRIORITIES, data['priority']);
  const amount = data['amount'];
  const dueAt = typeof data['dueAt'] === 'string' ? data['dueAt'] : '';
  const documentsRaw = data['documents'];
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) return fail('invalid_input');
  if (description.length > DESCRIPTION_MAX) return fail('invalid_input');
  if (!category || !priority) return fail('invalid_input');
  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > AMOUNT_MAX
  ) {
    return fail('invalid_input');
  }
  if (Number.isNaN(Date.parse(dueAt))) return fail('invalid_input');
  if (!Array.isArray(documentsRaw) || documentsRaw.length > DOCUMENTS_MAX) {
    return fail('invalid_input');
  }
  const documents: string[] = [];
  for (const item of documentsRaw as unknown[]) {
    const name = typeof item === 'string' ? sanitizeDocumentName(item) : null;
    if (!name) return fail('invalid_input');
    documents.push(name);
  }
  return ok({
    title,
    description,
    category,
    priority,
    amount,
    dueAt: new Date(dueAt).toISOString(),
    documents,
  });
}

export interface CreateCommand {
  readonly input: NewRequestInput;
  readonly submit: boolean;
}

export function parseCreateBody(raw: unknown): Result<CreateCommand, InputError> {
  const data = record(raw);
  if (!data || typeof data['submit'] !== 'boolean') return fail('invalid_input');
  const input = parseNewRequestInput(data['input']);
  return input.ok ? ok({ input: input.value, submit: data['submit'] }) : input;
}

export interface TransitionCommand {
  readonly action: WorkflowAction;
  readonly expectedStatus: RequestStatus;
  readonly expectedUpdatedAt?: string;
  readonly comment?: string;
}

export function parseTransitionBody(raw: unknown): Result<TransitionCommand, InputError> {
  const data = record(raw);
  if (!data) return fail('invalid_input');
  const action = oneOf(WORKFLOW_ACTIONS, data['action']);
  const expectedStatus = oneOf(REQUEST_STATUSES, data['expectedStatus']);
  const comment = data['comment'];
  const expectedUpdatedAt = data['expectedUpdatedAt'];
  if (!action || !expectedStatus) return fail('invalid_input');
  if (comment !== undefined && (typeof comment !== 'string' || comment.length > COMMENT_BODY_MAX)) {
    return fail('invalid_input');
  }
  if (expectedUpdatedAt !== undefined && typeof expectedUpdatedAt !== 'string') {
    return fail('invalid_input');
  }
  return ok({ action, expectedStatus, comment, expectedUpdatedAt });
}

export function parseCommentBody(raw: unknown): Result<string, InputError> {
  const data = record(raw);
  return data && typeof data['body'] === 'string' ? ok(data['body']) : fail('invalid_input');
}

export function parseDocumentBody(raw: unknown): Result<string, InputError> {
  const data = record(raw);
  return data && typeof data['name'] === 'string' ? ok(data['name']) : fail('invalid_input');
}
