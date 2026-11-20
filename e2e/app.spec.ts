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
      localStorage.setItem('opsflow.inbox.hint.dismissed', '1');
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

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

const SCREENS: readonly { name: string; hash: string; ready: string; role?: Role }[] = [
  { name: 'caixa de entrada', hash: '/inbox', ready: '[data-testid="inbox-list"]' },
  { name: 'solicitações', hash: '/requests', ready: '[data-testid="request-list"], .req-card' },
  { name: 'quadro', hash: '/board', ready: '[data-testid="board"]' },
  { name: 'análises', hash: '/analytics', ready: 'app-donut-chart' },
  { name: 'administração', hash: '/admin', ready: '.role-cards, [data-testid="rbac-matrix"]' },
  { name: 'detalhe', hash: '/requests/req-1', ready: '[data-testid="audit-timeline"]' },
  { name: 'wizard', hash: '/requests/new', ready: '#title', role: 'requester' },
];

const WIDTHS = [
  { label: 'desktop 1440', width: 1440, height: 900 },
  { label: 'celular 360', width: 360, height: 780 },
] as const;

test.describe('acessibilidade (axe, WCAG 2.2 AA) e sem rolagem horizontal', () => {
  for (const size of WIDTHS) {
    for (const theme of ['light', 'dark'] as const) {
      for (const screen of SCREENS) {
        test(`${screen.name} · ${size.label} · tema ${theme}`, async ({ page }) => {
          await page.setViewportSize({ width: size.width, height: size.height });
          await open(page, screen.hash, screen.role ?? 'approver', theme);
          await page.waitForSelector(screen.ready, { state: 'attached' });
          await page.waitForTimeout(900);
          await expectNoAxeViolations(page);
          await expectNoHorizontalScroll(page);
        });
      }
    }
  }
});

test.describe('fluxo de aprovação', () => {
  test('aprovar tira a tarefa da caixa, derruba o contador e oferece desfazer', async ({
    page,
  }) => {
    await open(page, '/inbox');
    const list = page.getByTestId('inbox-list');
    await expect(list).toBeVisible();
    const before = await list.locator('li.task').count();
    const badge = page.locator('.sidebar .count-pill');
    await expect(badge).toHaveText(String(before));
    const task = list.locator('li.task').filter({ hasText: 'Conferência QCon' });
    await task.getByRole('button', { name: 'Aprovar' }).click();
    await expect(page.getByRole('status').getByText(/OPS-0004 aprovada/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Desfazer' })).toBeVisible();
    await expect(list.locator('li.task')).toHaveCount(before - 1);
    await expect(badge).toHaveText(String(before - 1));
    // Aprovada, ela só aparece no filtro "Para concluir".
    await page.getByRole('button', { name: /Para concluir/ }).click();
    await expect(
      list
        .locator('li.task')
        .filter({ hasText: 'Conferência QCon' })
        .getByRole('button', { name: 'Concluir' }),
    ).toBeVisible();
  });

  test('desfazer devolve a tarefa à caixa antes de a decisão ser confirmada', async ({ page }) => {
    await open(page, '/inbox');
    const list = page.getByTestId('inbox-list');
    await expect(list).toBeVisible();
    const before = await list.locator('li.task').count();
    await list
      .locator('li.task')
      .filter({ hasText: 'Conferência QCon' })
      .getByRole('button', { name: 'Aprovar' })
      .click();
    await expect(list.locator('li.task')).toHaveCount(before - 1);
    await page.getByRole('button', { name: 'Desfazer' }).click();
    await expect(list.locator('li.task')).toHaveCount(before);
    await expect(page.locator('app-toasts').getByText('ação desfeita')).toBeVisible();
  });

  test('aprovar fora do prazo explica o atraso e pede a justificativa', async ({ page }) => {
    await open(page, '/inbox');
    const late = page.getByTestId('inbox-list').locator('li.task[data-sla="breached"]').first();
    await expect(late.getByText('aprove com justificativa')).toBeVisible();
    await late.getByRole('button', { name: 'Aprovar' }).click();
    const dialog = page.getByRole('dialog', { name: /Aprovar/ });
    await expect(dialog.getByRole('note')).toContainText('passou do prazo há');
    await dialog.getByRole('button', { name: 'Aprovar com justificativa' }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await dialog.getByLabel('Justificativa').fill('Aprovado com ciência da gestão.');
    await dialog.getByRole('button', { name: 'Aprovar com justificativa' }).click();
    await expect(dialog).toBeHidden();
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
    await expect(page.getByText(/rejeitada/).first()).toBeVisible();
  });

  test('lote: mostra progresso e resultado, e pula o que passou do prazo', async ({ page }) => {
    await open(page, '/inbox');
    await page.getByRole('button', { name: 'Selecionar aptas ao lote' }).click();
    const bar = page.getByRole('region', { name: 'Ação em lote' });
    await expect(bar).toBeVisible();
    const button = bar.getByRole('button', { name: /Aprovar \d+ solicitaç/ });
    const label = (await button.innerText()).trim();
    const count = Number(/\d+/.exec(label)?.[0]);
    await button.click();
    const result = page.locator('.batch-result');
    await expect(result).toContainText(`${count} aprovada`);
    await expect(page.getByRole('region', { name: 'Ação em lote' })).toHaveCount(0);
  });

  test('atalhos j/k movem o foco real e "a" aprova a tarefa em foco', async ({ page }) => {
    await open(page, '/inbox');
    await page.waitForSelector('li.task');
    for (let step = 0; step < 10; step += 1) {
      await page.keyboard.press('j');
      const sla = await page.locator('li.task.focused').getAttribute('data-sla');
      if (sla && sla !== 'breached') break;
    }
    const focused = page.locator('li.task.focused');
    await expect(focused).toHaveCount(1);
    await expect(focused).toHaveAttribute('aria-current', 'true');
    await expect(focused.locator('a.title')).toBeFocused();
    const id = await focused.getAttribute('id');
    await page.keyboard.press('a');
    await expect(page.getByRole('button', { name: 'Desfazer' })).toBeVisible();
    await expect(page.locator(`#${id}`)).toHaveCount(0);
  });

  test('atalhos ficam desligados com o painel de perfil aberto', async ({ page }) => {
    await open(page, '/inbox');
    await page.waitForSelector('li.task');
    await page.locator('.profile-trigger').click();
    await expect(page.getByRole('dialog', { name: 'Perfil de demonstração' })).toBeVisible();
    await page.keyboard.press('j');
    await expect(page.locator('li.task.focused')).toHaveCount(0);
  });
});

test.describe('quadro, papéis e dados', () => {
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
    await expect(
      page.locator('section[data-status="completed"] article', { hasText: code }),
    ).toBeVisible();
  });

  test('solicitante não abre a solicitação de outra pessoa (403 do servidor)', async ({ page }) => {
    await open(page, '/requests/req-1', 'requester');
    await expect(
      page.getByRole('heading', { name: 'Você não tem acesso a esta solicitação' }),
    ).toBeVisible();
    await expect(page.getByTestId('audit-timeline')).toHaveCount(0);
  });

  test('solicitante vê só as próprias solicitações e não vê ações de decisão', async ({ page }) => {
    await open(page, '/requests', 'requester');
    await page.waitForSelector('[data-testid="request-list"]', { state: 'attached' });
    const requesters = await page
      .locator('[data-testid="request-list"] tbody .person')
      .allInnerTexts();
    expect(requesters.length).toBeGreaterThan(0);
    expect(requesters.every((text) => text.includes('Ana Souza'))).toBe(true);
    await open(page, '/requests/req-2', 'requester');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aprovar' })).toHaveCount(0);
    await expect(page.getByTestId('audit-timeline')).toHaveCount(0);
  });

  test('auditor só consulta: caixa de entrada vazia e análises liberadas', async ({ page }) => {
    await open(page, '/inbox', 'auditor');
    await expect(page.getByText('Tudo em dia')).toBeVisible();
    await page.goto('./#/analytics');
    await expect(page.locator('app-donut-chart')).toBeVisible();
  });

  test('análises exigem acesso à auditoria: solicitante vê o aviso', async ({ page }) => {
    await open(page, '/analytics', 'requester');
    await expect(
      page.getByRole('heading', { name: 'Análises exigem acesso à auditoria' }),
    ).toBeVisible();
  });

  test('comentário em thread é publicado no detalhe', async ({ page }) => {
    await open(page, '/requests/req-1');
    await page.getByLabel('Escreva um comentário').fill('Conferi a proposta, tudo certo.');
    await page.getByRole('button', { name: 'Comentar' }).click();
    await expect(page.getByTestId('comment-thread')).toContainText(
      'Conferi a proposta, tudo certo.',
    );
  });

  test('trocar de papel recarrega os dados: o aprovador volta a ver tudo', async ({ page }) => {
    await open(page, '/requests', 'requester');
    await page.waitForSelector('[data-testid="request-list"]', { state: 'attached' });
    const own = await page.locator('[data-testid="request-list"] tbody tr').count();
    await page.locator('.profile-trigger').click();
    await page
      .getByRole('dialog', { name: 'Perfil de demonstração' })
      .getByText('Aprovador')
      .first()
      .click();
    await page.keyboard.press('Escape');
    await expect
      .poll(() => page.locator('[data-testid="request-list"] tbody tr').count())
      .toBeGreaterThan(own);
  });
});

test.describe('wizard, paleta e navegação', () => {
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
    await expect(
      page.getByRole('heading', { name: 'Licenças Figma para o time de Design' }),
    ).toBeVisible();
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

  test('recarregar numa rota interna continua funcionando (subcaminho + hash)', async ({
    page,
  }) => {
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

test.describe('celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('a barra inferior tem Caixa, Quadro, Solicitações e Mais, e "Mais" abre a folha', async ({
    page,
  }) => {
    await open(page, '/inbox');
    const nav = page.getByRole('navigation', { name: 'Navegação principal' }).last();
    await expect(nav.getByRole('link', { name: /Caixa/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Quadro' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Solicitações' })).toBeVisible();
    await nav.getByRole('button', { name: 'Mais' }).click();
    const sheet = page.getByRole('dialog', { name: 'Mais telas' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('link', { name: 'Administração' })).toBeVisible();
    await expect(sheet.getByRole('link', { name: 'Análises' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Perfil de demonstração/ })).toBeVisible();
    await sheet.getByRole('link', { name: 'Administração' }).click();
    await expect(page).toHaveURL(/#\/admin/);
  });

  test('solicitante ganha "Nova" no lugar de "Quadro" na barra inferior', async ({ page }) => {
    await open(page, '/inbox', 'requester');
    const nav = page.getByRole('navigation', { name: 'Navegação principal' }).last();
    await expect(nav.getByRole('link', { name: 'Nova' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Quadro' })).toHaveCount(0);
  });

  test('lista em cartões mostra 15 e carrega o resto sob demanda', async ({ page }) => {
    await open(page, '/requests');
    await page.waitForSelector('.req-card');
    await expect(page.locator('.req-card')).toHaveCount(15);
    await page.getByRole('button', { name: /Mostrar mais/ }).click();
    expect(await page.locator('.req-card').count()).toBeGreaterThan(15);
  });

  test('rodapé do wizard cabe: enviar em largura total e salvar rascunho embaixo', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await open(page, '/requests/new', 'requester');
    await page.getByLabel('Título').fill('Licenças Figma para o time de Design');
    await page.getByLabel('Valor (R$)').fill('21600');
    await page.getByRole('button', { name: 'Avançar' }).click();
    await page.getByRole('button', { name: 'Avançar' }).click();
    const submit = page.getByRole('button', { name: 'Enviar para revisão' });
    const draft = page.getByRole('button', { name: 'Salvar rascunho' });
    await expect(submit).toBeVisible();
    const submitBox = await submit.boundingBox();
    const draftBox = await draft.boundingBox();
    expect(submitBox && submitBox.x >= 0 && submitBox.x + submitBox.width <= 360).toBe(true);
    expect(submitBox && submitBox.width).toBeGreaterThan(280);
    expect(draftBox && submitBox && draftBox.y > submitBox.y).toBe(true);
  });
});
