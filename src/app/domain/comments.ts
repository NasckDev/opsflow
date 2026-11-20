import { Role } from './request.model';

export const COMMENT_MAX_LENGTH = 1000;
export const DOCUMENT_NAME_MAX_LENGTH = 80;

/** Comentário em thread numa solicitação (separado da trilha de auditoria). */
export interface RequestComment {
  readonly id: string;
  readonly requestId: string;
  readonly author: string;
  readonly role: Role;
  readonly at: string;
  readonly body: string;
}

export type CommentError = 'empty_comment' | 'comment_too_long';

export function validateCommentBody(body: string): CommentError | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) return 'empty_comment';
  return trimmed.length > COMMENT_MAX_LENGTH ? 'comment_too_long' : null;
}

/** Caracteres de controle e barras não entram em nomes de arquivo simulados. */
function stripUnsafe(raw: string): string {
  let out = '';
  for (const char of raw) {
    const code = char.charCodeAt(0);
    if (code >= 32 && char !== '/' && char !== '\\') out += char;
  }
  return out;
}

/** Nome de arquivo simulado, limpo e limitado a 80 caracteres; null se ficar vazio. */
export function sanitizeDocumentName(raw: string): string | null {
  const name = stripUnsafe(raw).trim().slice(0, DOCUMENT_NAME_MAX_LENGTH);
  return name.length > 0 ? name : null;
}
