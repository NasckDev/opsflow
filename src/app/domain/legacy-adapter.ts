import { appendAuditEntry, createAuditEntry } from './audit';
import {
  AuditEntry,
  Category,
  Priority,
  RequestStatus,
  Result,
  WorkflowRequest,
  fail,
  ok,
} from './request.model';

/** Formato do sistema legado (exportação JSON do ERP antigo, dados fictícios). */
export interface LegacyRequest {
  readonly REQ_ID: number;
  readonly TITULO: string;
  readonly DESCR?: string;
  readonly TIPO: string;
  readonly STATUS_CD: string;
  readonly PRIORIDADE: number;
  readonly VALOR: string;
  readonly SOLICITANTE: string;
  readonly DT_CRIACAO: string;
  readonly DT_LIMITE: string;
  readonly ANEXOS?: string;
}

export type LegacyAdapterError =
  | 'unknown_status'
  | 'unknown_category'
  | 'invalid_priority'
  | 'invalid_amount'
  | 'invalid_date'
  | 'missing_title';

const STATUS_MAP: Readonly<Record<string, RequestStatus>> = {
  RASC: 'draft',
  REV: 'in_review',
  DEV: 'returned',
  APR: 'approved',
  REJ: 'rejected',
  CONC: 'completed',
};

const CATEGORY_MAP: Readonly<Record<string, Category>> = {
  COMPRA: 'purchase',
  VIAGEM: 'travel',
  ACESSO: 'access',
  CONTRATO: 'contract',
};

const PRIORITY_MAP: Readonly<Record<number, Priority>> = { 1: 'high', 2: 'medium', 3: 'low' };

const LEGACY_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const LEGACY_AMOUNT = /^\d{1,3}(\.\d{3})*,\d{2}$/;

/** "31/12/2026" → ISO em UTC. Rejeita datas inexistentes como 31/02. */
export function parseLegacyDate(value: string): string | null {
  const match = LEGACY_DATE.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isSameDay = date.getUTCDate() === day && date.getUTCMonth() === month - 1;
  return isSameDay ? date.toISOString() : null;
}

/** "1.234,56" → 1234.56 */
export function parseLegacyAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!LEGACY_AMOUNT.test(trimmed)) return null;
  return Number(trimmed.replace(/\./g, '').replace(',', '.'));
}

function parseDocuments(value: string | undefined): readonly string[] {
  return (value ?? '')
    .split(';')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

function migrationTrail(id: string, status: RequestStatus, at: string): readonly AuditEntry[] {
  const entry = createAuditEntry(`${id}-1`, {
    actor: { name: 'Migração legado', role: 'admin' },
    action: 'migrate',
    from: null,
    to: status,
    at: new Date(at),
    comment: 'Importado do sistema legado',
  });
  return appendAuditEntry([], entry);
}

/** Adapter anticorrupção: valida e traduz o registro legado para o domínio novo. */
export function adaptLegacyRequest(
  legacy: LegacyRequest,
): Result<WorkflowRequest, LegacyAdapterError> {
  const status = STATUS_MAP[legacy.STATUS_CD];
  const category = CATEGORY_MAP[legacy.TIPO];
  const priority = PRIORITY_MAP[legacy.PRIORIDADE];
  const amount = parseLegacyAmount(legacy.VALOR);
  const createdAt = parseLegacyDate(legacy.DT_CRIACAO);
  const dueAt = parseLegacyDate(legacy.DT_LIMITE);

  if (!legacy.TITULO.trim()) return fail('missing_title');
  if (!status) return fail('unknown_status');
  if (!category) return fail('unknown_category');
  if (!priority) return fail('invalid_priority');
  if (amount === null) return fail('invalid_amount');
  if (!createdAt || !dueAt) return fail('invalid_date');

  const id = `legacy-${legacy.REQ_ID}`;
  return ok({
    id,
    code: `LEG-${String(legacy.REQ_ID).padStart(5, '0')}`,
    title: legacy.TITULO.trim(),
    description: legacy.DESCR?.trim() ?? '',
    category,
    priority,
    amount,
    requester: legacy.SOLICITANTE.trim(),
    status,
    createdAt,
    updatedAt: createdAt,
    dueAt,
    documents: parseDocuments(legacy.ANEXOS),
    audit: migrationTrail(id, status, createdAt),
  });
}
