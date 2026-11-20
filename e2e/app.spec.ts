import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';

type Role = 'requester' | 'reviewer' | 'approver' | 'auditor' | 'admin';
type Theme = 'light' | 'dark';

/** Abre o app já com papel e tema definidos (o app lê as duas preferências do localStorage). */
async function open(page: Page, hash: string, role: Role = 'approver', theme: Theme = 'light') {
  await page.addInitScript(
    ([storedRole, storedTheme]) => {
      localStorage.setItem('opsflow.role', storedRole);
      localStorage.setItem('opsflow.theme', storedTheme);
    },
    [role, theme],
  );
  await page.goto(`./#${hash}`);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.map((violation) => `${violation.id}: ${violation.nodes.length} nó(s)`),
  ).toEqual([]);
}

const SCREENS: readonly { name: string; hash: string; ready: string; role?: Role }[] = [
  { name: 'caixa de entrada', hash: '/inbox', ready: '[data-testid="inbox-list"]' },
  { name: 'solicitações', hash: '/requests', ready: '[data-testid="request-list"]' },
  { name: 'quadro', hash: '/board', ready: '[data-testid="board"]' },
  { name: 'análises', hash: '/analytics', ready: 'app-donut-chart' },
  { name: 'administração', hash: '/admin', ready: '[data-testid="rbac-matrix"]' },
  { name: 'detalhe', hash: '/requests/req-1', ready: '[data-testid="audit-timeline"]' },
  { name: 'wizard', hash: '/requests/new', ready: '#title', role: 'requester' },
];

test.describe('acessibilidade (axe, WCAG 2.2 AA)', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const screen of SCREENS) {
      test(`${screen.name} no tema ${theme}`, async ({ page }) => {
        await open(page, screen.hash, screen.role ?? 'approver', theme);
        await page.waitForSelector(screen.ready, { state: 'attached' });
        await page.waitForTimeout(900);
        await expectNoAxeViolations(page);
      });
    }
  }
});

test.describe('fluxos', () => {
  test('aprovador aprova uma tarefa direto da caixa de entrada', async ({ page }) => {
    await open(page, '/inbox');
    const list = page.getByTestId('inbox-list');
    await expect(list).toBeVisible();
    const task = list.locator('li.task').filter({ hasText: 'Conferência QCon' });
    await task.getByRole('button', { name: 'Aprovar' }).click();
    await expect(page.getByText('Ação "Aprovar" registrada').first()).toBeVisible();
    // Depois de aprovada, a próxima ação do aprovador é concluir.
    await expect(task.getByRole('button', { name: 'Concluir' })).toBeVisible();
    await expect(task.getByRole('button', { name: 'Aprovar' })).toHaveCount(0);
  });

  test('rejeitar pede o comentário obrigatório antes de concluir', async ({ page }) => {
    await open(page, '/inbox');
    await page.getByRole('button', { name: 'Rejeitar' }).first().click();
    const dialog = page.getByRole('dialog', { name: /Rejeitar/ });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Confirmar' }).click();
    await expect(dialog.getByRole('alert')).toContainText('comentário');
    await dialog.getByLabel('Comentário').fill('Fora do orçamento do trimestre.');
    await dialog.getByRole('button', { name: 'Confirmar' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Ação "Rejeitar" registrada').first()).toBeVisible();
  });

  test('aprovação em lote aprova só as tarefas sem SLA estourado', async ({ page }) => {
    await open(page, '/inbox');
    await page.getByLabel('Selecionar aptas ao lote').check();
    const bar = page.getByRole('region', { name: 'Ação em lote' });
    await expect(bar).toBeVisible();
    await bar.getByRole('button', { name: /Aprovar \d+ solicitaç/ }).click();
    await expect(page.getByText(/solicitaç(ão|ões) aprovadas?/).first()).toBeVisible();
  });

  test('atalhos j/k movem o foco e "a" aprova a tarefa em foco', async ({ page }) => {
    await open(page, '/inbox');
    await page.waitForSelector('li.task');
    // Tarefas com SLA estourado pedem justificativa; avança até uma que aprova direto.
    for (let step = 0; step < 10; step += 1) {
      await page.keyboard.press('j');
      const sla = await page.locator('li.task.focused').getAttribute('data-sla');
      if (sla && sla !== 'breached') break;
    }
    await expect(page.locator('li.task.focused')).toHaveCount(1);
    const focused = page.locator('li.task.focused');
    await page.keyboard.press('a');
    await expect(page.getByText('Ação "Aprovar" registrada').first()).toBeVisible();
    await expect(focused.getByRole('button', { name: 'Aprovar' })).toHaveCount(0);
  });

  test('quadro bloqueia uma transição que a máquina de estados não prevê', async ({ page }) => {
    await open(page, '/board');
    const board = page.getByTestId('board');
    await expect(board).toBeVisible();
    const card = board.locator('section[data-status="draft"] article').first();
    const target = board.locator('section[data-status="completed"] .drop');
    const from = await card.boundingBox();
    const to = await target.boundingBox();
    if (!from || !to) throw new Error('quadro sem geometria');
    await page.mouse.move(from.x + from.width / 2, from.y + 20);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 12, from.y + 30, { steps: 4 });
    await page.mouse.move(to.x + to.width / 2, to.y + 40, { steps: 20 });
    await page.mouse.up();
    await expect(page.getByText(/o fluxo não prevê essa transição/)).toBeVisible();
  });

  test('quadro move um cartão por "Mover para" (alternativa ao arrastar)', async ({ page }) => {
    await open(page, '/board');
    const card = page.locator('section[data-status="approved"] article').first();
    const code = (await card.locator('.code').innerText()).trim();
    await card.getByRole('combobox').selectOption({ label: 'Concluído' });
    await expect(page.locator('section[data-status="completed"] article', { hasText: code })).toBeVisible();
  });

  test('segregação de funções: solicitante não vê ações de decisão', async ({ page }) => {
    await open(page, '/requests/req-1', 'requester');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aprovar' })).toHaveCount(0);
    await expect(page.getByTestId('audit-timeline')).toHaveCount(0);
  });

  test('auditor só consulta: caixa de entrada vazia e sem ações', async ({ page }) => {
    await open(page, '/inbox', 'auditor');
    await expect(page.getByText('Tudo em dia')).toBeVisible();
  });

  test('comentário em thread é publicado no detalhe', async ({ page }) => {
    await open(page, '/requests/req-1');
    await page.getByLabel('Escreva um comentário').fill('Conferi a proposta, tudo certo.');
    await page.getByRole('button', { name: 'Comentar' }).click();
    await expect(page.getByTestId('comment-thread')).toContainText('Conferi a proposta, tudo certo.');
  });

  test('wizard recupera o rascunho salvo automaticamente após recarregar', async ({ page }) => {
    await open(page, '/requests/new', 'requester');
    await page.getByLabel('Título').fill('Notebooks para o time de dados');
    await page.getByLabel('Valor (R$)').fill('48000');
    await page.getByText(/Rascunho salvo automaticamente/).waitFor();
    await page.reload();
    await expect(page.getByText('Recuperamos o rascunho')).toBeVisible();
    await expect(page.getByLabel('Título')).toHaveValue('Notebooks para o time de dados');
    await page.getByRole('button', { name: 'Descartar rascunho' }).click();
    await expect(page.getByLabel('Título')).toHaveValue('');
  });

  test('wizard cria a solicitação e abre o detalhe', async ({ page }) => {
    await open(page, '/requests/new', 'requester');
    await page.getByLabel('Título').fill('Licenças Figma para o time de Design');
    await page.getByLabel('Valor (R$)').fill('21600');
    await page.getByRole('button', { name: 'Avançar' }).click();
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(page.getByTestId('wizard-summary')).toContainText('Licenças Figma');
    await page.getByRole('button', { name: 'Enviar para revisão' }).click();
    await expect(page).toHaveURL(/#\/requests\/req-\d+/);
    await expect(page.getByRole('heading', { name: 'Licenças Figma para o time de Design' })).toBeVisible();
  });

  test('paleta de comandos (Ctrl+K) navega e o menu volta o foco ao fechar', async ({ page }) => {
    await open(page, '/inbox');
    await page.waitForSelector('li.task');
    await page.keyboard.press('Control+k');
    const palette = page.getByRole('dialog', { name: 'Paleta de comandos' });
    await expect(palette).toBeVisible();
    await page.getByRole('combobox').fill('analises');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/analytics/);
    const trigger = page.locator('.profile-trigger');
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Perfil de demonstração' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('recarregar numa rota interna continua funcionando (subcaminho + hash)', async ({ page }) => {
    await open(page, '/requests/req-3');
    await page.waitForSelector('[data-testid="audit-timeline"]');
    await page.reload();
    await expect(page.getByTestId('audit-timeline')).toBeVisible();
  });

  test('idioma em inglês traduz a navegação', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('opsflow.locale', 'en'));
    await open(page, '/inbox');
    await expect(page.getByRole('link', { name: /Inbox/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Analytics' }).first()).toBeVisible();
  });
});
