import { SlaEvaluation, evaluateSla } from './sla';
import { Actor, WorkflowAction, WorkflowRequest } from './request.model';
import { availableActions } from './workflow-machine';

/** "todo": falta decidir ou enviar. "conclude": já aprovada, só falta concluir. */
export type InboxStage = 'todo' | 'conclude';

export interface InboxTask {
  readonly stage: InboxStage;
  readonly request: WorkflowRequest;
  readonly actions: readonly WorkflowAction[];
  readonly sla: SlaEvaluation;
}

/**
 * Tarefas de quem está logado: solicitações em que o papel pode agir agora.
 * Solicitante só vê as próprias. Ordena pelo prazo mais urgente primeiro.
 */
export function inboxTasks(
  requests: readonly WorkflowRequest[],
  actor: Actor,
  now: Date,
): InboxTask[] {
  return requests
    .filter((request) => actor.role !== 'requester' || request.requester === actor.name)
    .map((request) => {
      const actions = availableActions(request, actor);
      const onlyConclude = actions.length > 0 && actions.every((action) => action === 'complete');
      return {
        stage: onlyConclude ? ('conclude' as const) : ('todo' as const),
        request,
        actions,
        sla: evaluateSla(request, now),
      };
    })
    .filter((task) => task.actions.length > 0)
    .sort((a, b) => a.request.dueAt.localeCompare(b.request.dueAt));
}

/**
 * Aprovação em lote só vale para o que não exige justificativa: itens com SLA
 * estourado precisam de comentário individual.
 */
export function canBatchApprove(task: InboxTask): boolean {
  return task.actions.includes('approve') && task.sla.state !== 'breached';
}

/** Pendências de decisão ou envio (o que o contador da caixa de entrada mostra). */
export function todoTasks(tasks: readonly InboxTask[]): InboxTask[] {
  return tasks.filter((task) => task.stage === 'todo');
}
