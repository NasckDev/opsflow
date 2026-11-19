import { AuditAction, AuditEntry, Actor, RequestStatus } from './request.model';

export interface AuditEntryInput {
  readonly actor: Actor;
  readonly action: AuditAction;
  readonly from: RequestStatus | null;
  readonly to: RequestStatus;
  readonly at: Date;
  readonly comment?: string;
}

/** Cria uma entrada congelada; comentários vazios são omitidos. */
export function createAuditEntry(id: string, input: AuditEntryInput): AuditEntry {
  const comment = input.comment?.trim();
  return Object.freeze({
    id,
    at: input.at.toISOString(),
    actor: input.actor.name,
    role: input.actor.role,
    action: input.action,
    from: input.from,
    to: input.to,
    ...(comment ? { comment } : {}),
  });
}

/** Append-only: devolve uma nova trilha congelada sem tocar na original. */
export function appendAuditEntry(
  trail: readonly AuditEntry[],
  entry: AuditEntry,
): readonly AuditEntry[] {
  return Object.freeze([...trail, Object.freeze({ ...entry })]);
}
