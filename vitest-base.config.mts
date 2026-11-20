import { defineConfig } from 'vitest/config';

/**
 * Configuração base do Vitest usada pelo `ng test`. Threads com poucos workers evitam o
 * "Timeout waiting for worker to respond" em máquinas lentas ou sobrecarregadas.
 */
export default defineConfig({
  test: {
    pool: 'threads',
    maxWorkers: 2,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
