import { AuditAction, WorkflowAction } from '../domain/request.model';
import { IconName } from './icon';

/** Ícone de cada ação do fluxo (e dos dois eventos de auditoria que não são ações). */
export const ACTION_ICONS: Readonly<Record<AuditAction, IconName>> = {
  create: 'plusCircle',
  migrate: 'history',
  submit: 'send',
  resubmit: 'send',
  return: 'undo',
  approve: 'checkCircle',
  reject: 'xCircle',
  complete: 'check',
};

/** Classe do botão de cada ação: aprovar é verde, rejeitar é vermelho, o resto é primário ou neutro. */
export const ACTION_BUTTON_CLASS: Readonly<Record<WorkflowAction, string>> = {
  submit: 'btn-primary',
  resubmit: 'btn-primary',
  complete: 'btn-primary',
  approve: 'btn-success',
  reject: 'btn-danger',
  return: '',
};
