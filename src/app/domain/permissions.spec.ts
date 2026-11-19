import { PERMISSIONS, Permission, can } from './permissions';
import { ROLES, Role } from './request.model';

type Row = readonly [Role, Permission, boolean];

/** Matriz esperada explícita: qualquer mudança na RBAC quebra este teste. */
const EXPECTED: Readonly<Record<Role, readonly Permission[]>> = {
  requester: ['request.create', 'request.submit'],
  reviewer: ['request.return', 'request.reject', 'audit.view'],
  approver: ['request.approve', 'request.reject', 'request.complete', 'audit.view'],
  auditor: ['audit.view'],
  admin: [...PERMISSIONS],
};

const table: Row[] = ROLES.flatMap((role) =>
  PERMISSIONS.map((permission): Row => [role, permission, EXPECTED[role].includes(permission)]),
);

describe('RBAC permission matrix', () => {
  it('covers every role x permission pair', () => {
    expect(table).toHaveLength(ROLES.length * PERMISSIONS.length);
  });

  it.each(table)('%s / %s → %s', (role, permission, expected) => {
    expect(can(role, permission)).toBe(expected);
  });

  it('keeps the auditor strictly read-only', () => {
    const writes = PERMISSIONS.filter((permission) => permission !== 'audit.view');
    expect(writes.some((permission) => can('auditor', permission))).toBe(false);
  });
});
