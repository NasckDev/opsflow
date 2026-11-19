import { Role } from './request.model';

export const PERMISSIONS = [
  'request.create',
  'request.submit',
  'request.return',
  'request.approve',
  'request.reject',
  'request.complete',
  'audit.view',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * Matriz RBAC: fonte única de verdade sobre o que cada papel pode fazer.
 * Auditor é somente leitura; admin tem todas as permissões, mas continua
 * sujeito à segregação de funções aplicada pela máquina de estados.
 */
export const PERMISSION_MATRIX: Readonly<Record<Role, readonly Permission[]>> = Object.freeze({
  requester: ['request.create', 'request.submit'],
  reviewer: ['request.return', 'request.reject', 'audit.view'],
  approver: ['request.approve', 'request.reject', 'request.complete', 'audit.view'],
  auditor: ['audit.view'],
  admin: [...PERMISSIONS],
});

export function can(role: Role, permission: Permission): boolean {
  return PERMISSION_MATRIX[role].includes(permission);
}
