import { AuditAction, WorkflowAction } from '../domain/request.model';
import { UiIconName } from '../ui';

/** Ícone de cada ação do fluxo (e dos dois eventos de auditoria que não são ações). */
export const ACTION_ICONS: Readonly<Record<AuditAction, UiIconName>> = {
  create: 'plus-circle',
  migrate: 'history',
  submit: 'send',
  resubmit: 'send',
  return: 'undo',
  approve: 'check-circle',
  reject: 'close-circle',
  complete: 'check',
};

/**
 * Variante do botão de cada ação. Aprovar, enviar e concluir usam o amarelo de sinalização (só uma
 * delas aparece por solicitação, então nunca há dois botões amarelos na mesma área); rejeitar tem
 * contorno laranja e devolver é neutro.
 */
export const ACTION_BUTTON: Readonly<
  Record<WorkflowAction, { variant: 'primary' | 'default'; tone: 'default' | 'success'; danger: boolean }>
> = {
  submit: { variant: 'primary', tone: 'default', danger: false },
  resubmit: { variant: 'primary', tone: 'default', danger: false },
  complete: { variant: 'primary', tone: 'default', danger: false },
  approve: { variant: 'primary', tone: 'default', danger: false },
  reject: { variant: 'default', tone: 'default', danger: true },
  return: { variant: 'default', tone: 'default', danger: false },
};
