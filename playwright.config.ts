import { defineConfig } from '@playwright/test';

const PORT = Number(process.env['E2E_PORT'] ?? 4317);

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/projetos/opsflow/`,
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node e2e/serve.mjs',
    url: `http://localhost:${PORT}/projetos/opsflow/`,
    reuseExistingServer: !process.env['CI'],
    timeout: 30_000,
  },
});
