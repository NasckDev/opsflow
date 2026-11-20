import { WorkflowRequest } from './request.model';

export interface CsvLabels {
  readonly headers: readonly string[];
  readonly status: (value: WorkflowRequest['status']) => string;
  readonly priority: (value: WorkflowRequest['priority']) => string;
  readonly category: (value: WorkflowRequest['category']) => string;
}

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Escapa uma célula e neutraliza injeção de fórmula em planilhas (=, +, -, @). */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === 'string' && FORMULA_PREFIX.test(text)) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV com separador ";" e vírgula decimal, que o Excel em pt-BR abre sem assistente. */
export function requestsToCsv(
  requests: readonly WorkflowRequest[],
  labels: CsvLabels,
): string {
  const rows = requests.map((request) => [
    request.code,
    request.title,
    request.requester,
    labels.status(request.status),
    labels.priority(request.priority),
    labels.category(request.category),
    request.amount.toFixed(2).replace('.', ','),
    request.dueAt,
  ]);
  return [labels.headers, ...rows]
    .map((row) => row.map((cell) => csvCell(cell)).join(';'))
    .join('\r\n');
}
