import { RequestStatus, WorkflowAction } from './request.model';
import { TRANSITIONS } from './workflow-machine';

/** Colunas do quadro, na ordem do fluxo. */
export const BOARD_COLUMNS: readonly RequestStatus[] = [
  'draft',
  'in_review',
  'returned',
  'approved',
  'completed',
  'rejected',
];

/**
 * Ação do fluxo que leva `from` a `to`, ou null quando o movimento não existe
 * na máquina de estados (por exemplo, rascunho direto para aprovado).
 */
export function actionForMove(from: RequestStatus, to: RequestStatus): WorkflowAction | null {
  for (const [action, definition] of Object.entries(TRANSITIONS)) {
    if (definition.to === to && definition.from.includes(from)) {
      return action as WorkflowAction;
    }
  }
  return null;
}
