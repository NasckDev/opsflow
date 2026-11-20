import { Injectable, computed, effect, signal } from '@angular/core';
import { Permission, can } from '../../domain/permissions';
import { Actor, ROLES, Role } from '../../domain/request.model';
import { readStorage, writeStorage } from '../storage';

/** Usuários fictícios: um por papel, para demonstrar RBAC sem autenticação. */
export const DEMO_USERS: Readonly<Record<Role, string>> = {
  requester: 'Ana Souza',
  reviewer: 'Bruno Lima',
  approver: 'Carla Mendes',
  auditor: 'Diego Rocha',
  admin: 'Elisa Prado',
};

const STORAGE_KEY = 'opsflow.role';

function isRole(value: string | null): value is Role {
  return ROLES.some((role) => role === value);
}

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly role = signal<Role>(this.initialRole());

  readonly currentRole = this.role.asReadonly();
  readonly actor = computed<Actor>(() => ({
    role: this.role(),
    name: DEMO_USERS[this.role()],
  }));

  constructor() {
    effect(() => writeStorage(STORAGE_KEY, this.role()));
  }

  setRole(role: Role): void {
    this.role.set(role);
  }

  can(permission: Permission): boolean {
    return can(this.role(), permission);
  }

  private initialRole(): Role {
    const stored = readStorage(STORAGE_KEY);
    // A demo abre como Aprovador: é onde está o valor (decidir o que está na fila).
    return isRole(stored) ? stored : 'approver';
  }
}
