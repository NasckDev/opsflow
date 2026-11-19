export const REQUEST_STATUSES = [
  'draft',
  'in_review',
  'returned',
  'approved',
  'rejected',
  'completed',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const ROLES = ['requester', 'reviewer', 'approver', 'auditor', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CATEGORIES = ['purchase', 'travel', 'access', 'contract'] as const;
export type Category = (typeof CATEGORIES)[number];

export const WORKFLOW_ACTIONS = [
  'submit',
  'return',
  'resubmit',
  'approve',
  'reject',
  'complete',
] as const;
export type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];

export type AuditAction = 'create' | 'migrate' | WorkflowAction;

/** Entrada imutável da trilha de auditoria. */
export interface AuditEntry {
  readonly id: string;
  readonly at: string;
  readonly actor: string;
  readonly role: Role;
  readonly action: AuditAction;
  readonly from: RequestStatus | null;
  readonly to: RequestStatus;
  readonly comment?: string;
}

export interface WorkflowRequest {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly category: Category;
  readonly priority: Priority;
  readonly amount: number;
  readonly requester: string;
  readonly status: RequestStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly dueAt: string;
  readonly documents: readonly string[];
  readonly audit: readonly AuditEntry[];
}

export interface NewRequestInput {
  readonly title: string;
  readonly description: string;
  readonly category: Category;
  readonly priority: Priority;
  readonly amount: number;
  readonly dueAt: string;
  readonly documents: readonly string[];
}

export interface Actor {
  readonly name: string;
  readonly role: Role;
}

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const fail = <E>(error: E): Result<never, E> => ({ ok: false, error });
