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

/** Variante do botão de cada ação: aprovar é verde, rejeitar é vermelho, o resto é primário ou neutro. */
export const ACTION_BUTTON: Readonly<
  Record<WorkflowAction, { variant: 'primary' | 'default'; tone: 'default' | 'success'; danger: boolean }>
> = {
  submit: { variant: 'primary', tone: 'default', danger: false },
  resubmit: { variant: 'primary', tone: 'default', danger: false },
  complete: { variant: 'primary', tone: 'default', danger: false },
  approve: { variant: 'primary', tone: 'success', danger: false },
  reject: { variant: 'default', tone: 'default', danger: true },
  return: { variant: 'default', tone: 'default', danger: false },
};
