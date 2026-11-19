import { WorkflowRequest } from '../request.model';

export const FIXED_NOW = new Date('2026-11-19T12:00:00.000Z');

export function buildRequest(overrides: Partial<WorkflowRequest> = {}): WorkflowRequest {
  return {
    id: 'req-1',
    code: 'OPS-0001',
    title: 'Notebooks para o time de dados',
    description: 'Compra de 3 notebooks',
    category: 'purchase',
    priority: 'medium',
    amount: 15000,
    requester: 'Ana Souza',
    status: 'draft',
    createdAt: '2026-11-18T12:00:00.000Z',
    updatedAt: '2026-11-18T12:00:00.000Z',
    dueAt: '2026-11-25T12:00:00.000Z',
    documents: [],
    audit: [],
    ...overrides,
  };
}
