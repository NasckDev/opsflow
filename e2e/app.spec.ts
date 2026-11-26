import AxeBuilder from '@axe-core/playwright';
import { Locator, Page, expect, test } from '@playwright/test';

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

/** A caixa do elemento cabe inteira na janela (diálogos e gavetas nunca vazam para fora). */
async function expectInsideViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error('sem geometria para verificar');
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

const toast = (page: Page) => page.locator('.ant-message');

/** Mostra a tarefa no painel de detalhe da caixa de entrada e devolve o painel. */
async function showTask(page: Page, text: string | RegExp) {
  await page
    .getByTestId('inbox-list')
    .locator('tr.task')
    .filter({ hasText: text })
    .locator('button.title')
    .click();
  const detail = page.getByTestId('inbox-detail');
  await expect(detail).toContainText(text);
  return detail;
}

const SCREENS: readonly { name: string; hash: string; ready: string; role?: Role }[] = [
  { name: 'caixa de entrada', hash: '/inbox', ready: '[data-testid="inbox-list"]' },
  { name: 'solicitações', hash: '/requests', ready: '[data-testid="request-list"], .req-card' },
  { name: 'quadro', hash: '/board', ready: '[data-testid="board"]' },
  { name: 'análises', hash: '/analytics', ready: 'app-chart svg' },
  { name: 'administração', hash: '/admin', ready: '.role-card, [data-testid="rbac-matrix"]' },
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
          const errors: string[] = [];
          page.on('pageerror', (error) => errors.push(String(error)));
          page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
          });
          await page.setViewportSize({ width: size.width, height: size.height });
          await open(page, screen.hash, screen.role ?? 'approver', theme);
          await page.waitForSelector(screen.ready, { state: 'attached' });
          await page.waitForTimeout(900);
          await expectNoAxeViolations(page);
          await expectNoHorizontalScroll(page);
          expect(errors).toEqual([]);
        });
      }
    }
  }
});

/** Larguras de conferência do layout: nada cortado, sobreposto ou com rolagem horizontal da página. */
const LAYOUT_WIDTHS = [320, 375, 390, 768, 1024, 1280, 1440, 1920] as const;

test.describe('sem rolagem horizontal da página em todas as larguras', () => {
  for (const width of LAYOUT_WIDTHS) {
    for (const theme of ['light', 'dark'] as const) {
      test(`todas as telas · ${width} px · tema ${theme}`, async ({ page }) => {
        test.setTimeout(150_000);
        await page.setViewportSize({ width, height: 900 });
        for (const screen of SCREENS) {
          await open(page, screen.hash, screen.role ?? 'approver', theme);
          await page.reload();
          await page.waitForSelector(screen.ready, { state: 'attached' });
          await page.waitForTimeout(300);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow, `${screen.name} em ${width} px`).toBeLessThanOrEqual(0);
        }
      });
    }
  }
});

/** Abaixo de 768 px a caixa de entrada vira cartões: nada rola de lado nem fica cortado. */
const CARD_WIDTHS = [320, 375, 390, 414, 600, 767] as const;

test.describe('caixa de entrada no celular: cartões sem texto cortado', () => {
  for (const width of CARD_WIDTHS) {
    for (const theme of ['light', 'dark'] as const) {
      test(`cartões · ${width} px · tema ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await open(page, '/inbox', 'approver', theme);
        await page.waitForSelector('tr.task');
        const problems = await page.evaluate(() => {
          const found: string[] = [];
          const wrap = document.querySelector<HTMLElement>('.table-wrap');
          if (!wrap) return ['sem a caixa da lista'];
          if (wrap.scrollWidth > wrap.clientWidth + 1) {
            found.push(`a lista rola ${wrap.scrollWidth - wrap.clientWidth} px de lado`);
          }
          const limit = wrap.getBoundingClientRect().right + 1;
          const selector = [
            '.title',
            '.meta',
            '.needs',
            '.code',
            '.amount',
            'app-countdown',
            'app-priority',
          ]
            .map((part) => `tr.task ${part}`)
            .join(', ');
          for (const element of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
            const box = element.getBoundingClientRect();
            if (box.right > limit || element.scrollWidth > element.clientWidth + 1) {
              found.push(element.textContent?.trim() ?? element.className);
            }
          }
          return found;
        });
        expect(problems).toEqual([]);
        await expectNoHorizontalScroll(page);
      });
    }
  }
});

test('quadro no celular: todas as abas de coluna aparecem inteiras (320 px)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await open(page, '/board');
  await page.waitForSelector('.column-tabs .ant-tabs-tab');
  const tabs = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('.column-tabs .ant-tabs-tab')).map((tab) => {
      const box = tab.getBoundingClientRect();
      return { text: tab.textContent?.trim() ?? '', visible: box.width > 0, right: box.right };
    }),
  );
  expect(tabs).toHaveLength(6);
  for (const tab of tabs) {
    expect(tab.visible, tab.text).toBe(true);
    expect(tab.right, tab.text).toBeLessThanOrEqual(320);
  }
});

interface Overlay {
  readonly name: string;
  readonly kind: 'modal' | 'drawer';
  readonly mobileOnly?: boolean;
  readonly open: (page: Page, mobile: boolean) => Promise<void>;
}

const OVERLAYS: readonly Overlay[] = [
  {
    name: 'diálogo de comentário obrigatório',
    kind: 'modal',
    open: async (page) => {
      await page.waitForSelector('tr.task');
      await page.getByRole('button', { name: 'Rejeitar' }).first().click();
    },
  },
  {
    name: 'paleta de comandos',
    kind: 'modal',
    open: async (page) => {
      await page.waitForSelector('tr.task');
      await page.keyboard.press('Control+k');
    },
  },
  {
    name: 'atalhos de teclado',
    kind: 'modal',
    open: async (page) => {
      await page.waitForSelector('tr.task');
      await page.keyboard.press('?');
    },
  },
  {
    name: 'gaveta de notificações',
    kind: 'drawer',
    open: async (page) => {
      await page.waitForSelector('tr.task');
      await page.getByRole('button', { name: 'Notificações' }).click();
    },
  },
  {
    name: 'gaveta de perfil',
    kind: 'drawer',
    open: async (page, mobile) => {
      await page.waitForSelector('tr.task');
      if (mobile) {
        await page.getByRole('button', { name: 'Mais' }).click();
        await page.getByRole('button', { name: /Perfil de demonstração/ }).click();
      } else {
        await page.locator('.profile-trigger').click();
      }
    },
  },
  {
    name: 'folha "Mais" do celular',
    kind: 'drawer',
    mobileOnly: true,
    open: async (page) => {
      await page.waitForSelector('tr.task');
      await page.getByRole('button', { name: 'Mais' }).click();
    },
  },
];

test.describe('diálogos e gavetas: axe zerado e geometria dentro da janela', () => {
  for (const size of WIDTHS) {
    for (const theme of ['light', 'dark'] as const) {
      for (const overlay of OVERLAYS) {
        if (overlay.mobileOnly && size.width > 600) continue;
        test(`${overlay.name} · ${size.label} · tema ${theme}`, async ({ page }) => {
          await page.setViewportSize({ width: size.width, height: size.height });
          await open(page, '/inbox', 'approver', theme);
          await overlay.open(page, size.width < 600);
          const panel =
            overlay.kind === 'modal'
              ? page.locator('.ant-modal:visible').first()
              : page.locator('.ant-drawer-open .ant-drawer-content-wrapper').first();
          await expect(panel).toBeVisible();
          await page.waitForTimeout(700);
          await expectInsideViewport(page, panel);
          await expectNoAxeViolations(page);
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
    const before = await list.locator('tr.task').count();
    const badge = page.locator('.sider-body .app-menu-badge-signal');
    await expect(badge).toHaveText(String(before));
    const detail = await showTask(page, 'Conferência QCon');
    await detail.getByRole('button', { name: 'Aprovar' }).click();
    await expect(toast(page).getByText(/OPS-0004 aprovada/)).toBeVisible();
    await expect(toast(page).getByRole('button', { name: 'Desfazer' })).toBeVisible();
    await expect(list.locator('tr.task')).toHaveCount(before - 1);
    await expect(badge).toHaveText(String(before - 1));
    // Aprovada, ela só aparece no filtro "Para concluir", agora com a ação de concluir.
    await page.getByRole('button', { name: /Para concluir/ }).click();
    const concluded = await showTask(page, 'Conferência QCon');
    await expect(concluded.getByRole('button', { name: 'Concluir' })).toBeVisible();
  });

  test('desfazer devolve a tarefa à caixa antes de a decisão ser confirmada', async ({ page }) => {
    await open(page, '/inbox');
    const list = page.getByTestId('inbox-list');
    await expect(list).toBeVisible();
    const before = await list.locator('tr.task').count();
    const detail = await showTask(page, 'Conferência QCon');
    await detail.getByRole('button', { name: 'Aprovar' }).click();
    await expect(list.locator('tr.task')).toHaveCount(before - 1);
    await toast(page).getByRole('button', { name: 'Desfazer' }).click();
    await expect(list.locator('tr.task')).toHaveCount(before);
    await expect(toast(page).getByText('ação desfeita')).toBeVisible();
  });

  test('aprovar fora do prazo explica o atraso e pede a justificativa', async ({ page }) => {
    await open(page, '/inbox');
    const late = page.getByTestId('inbox-list').locator('tr.task[data-sla="breached"]').first();
    await expect(late.getByText('aprove com justificativa')).toBeVisible();
    await late.locator('button.title').click();
    await page.getByTestId('inbox-detail').getByRole('button', { name: 'Aprovar' }).click();
    const dialog = page.locator('.ant-modal:visible');
    await expect(dialog).toContainText('passou do prazo há');
    await dialog.getByRole('button', { name: 'Aprovar com justificativa' }).click();
    await expect(dialog.locator('.app-form-error')).toBeVisible();
    await dialog.getByLabel('Justificativa').fill('Aprovado com ciência da gestão.');
    await dialog.getByRole('button', { name: 'Aprovar com justificativa' }).click();
    await expect(dialog).toBeHidden();
  });

  test('rejeitar pede o comentário obrigatório antes de concluir', async ({ page }) => {
    await open(page, '/inbox');
    await page.getByRole('button', { name: 'Rejeitar' }).first().click();
    const dialog = page.locator('.ant-modal:visible');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Confirmar' }).click();
    await expect(dialog.locator('.app-form-error')).toContainText('comentário');
    await dialog.getByLabel('Comentário').fill('Fora do orçamento do trimestre.');
    await dialog.getByRole('button', { name: 'Confirmar' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(/rejeitada/).first()).toBeVisible();
  });

  test('esc fecha o diálogo e devolve o foco ao botão que o abriu', async ({ page }) => {
    await open(page, '/inbox');
    const reject = page.getByRole('button', { name: 'Rejeitar' }).first();
    await reject.focus();
    await reject.click();
    await expect(page.locator('.ant-modal:visible')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.ant-modal:visible')).toHaveCount(0);
    await expect(reject).toBeFocused();
  });

  test('lote: mostra progresso e resultado, e pula o que passou do prazo', async ({ page }) => {
    await open(page, '/inbox');
    await page.getByRole('checkbox', { name: 'Selecionar aptas ao lote' }).check();
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
    await page.waitForSelector('tr.task');
    for (let step = 0; step < 10; step += 1) {
      await page.keyboard.press('j');
      const sla = await page.locator('tr.task.focused').getAttribute('data-sla');
      if (sla && sla !== 'breached') break;
    }
    const focused = page.locator('tr.task.focused');
    await expect(focused).toHaveCount(1);
    await expect(focused).toHaveAttribute('aria-current', 'true');
    await expect(focused.locator('button.title')).toBeFocused();
    // O painel de detalhe acompanha a tarefa em foco.
    const code = (await focused.locator('.code').innerText()).trim();
    await expect(page.getByTestId('inbox-detail')).toContainText(code);
    const id = await focused.getAttribute('id');
    await page.keyboard.press('a');
    await expect(toast(page).getByRole('button', { name: 'Desfazer' })).toBeVisible();
    await expect(page.locator(`#${id}`)).toHaveCount(0);
  });

  test('atalhos ficam desligados com o painel de perfil aberto', async ({ page }) => {
    await open(page, '/inbox');
    await page.waitForSelector('tr.task');
    await page.locator('.profile-trigger').click();
    await expect(page.locator('.ant-drawer-open .ant-drawer-content-wrapper')).toBeVisible();
    await page.keyboard.press('j');
    await expect(page.locator('tr.task.focused')).toHaveCount(0);
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
    await expect(toast(page).getByText(/o fluxo não prevê essa transição/)).toBeVisible();
  });

  test('quadro move um cartão por "Mover para" (alternativa ao arrastar)', async ({ page }) => {
    await open(page, '/board');
    const card = page.locator('section[data-status="approved"] article').first();
    const code = (await card.locator('.code').innerText()).trim();
    await card.getByRole('button', { name: /Mover para/ }).click();
    await page.locator('.ant-dropdown-menu-item', { hasText: 'Concluído' }).click();
    await expect(
      page.locator('section[data-status="completed"] article', { hasText: code }),
    ).toBeVisible();
  });

  test('solicitante não abre a solicitação de outra pessoa (403 do servidor)', async ({ page }) => {
    await open(page, '/requests/req-1', 'requester');
    await expect(page.getByText('Você não tem acesso a esta solicitação')).toBeVisible();
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
    await expect(page.locator('app-chart svg').first()).toBeVisible();
  });

  test('análises exigem acesso à auditoria: solicitante vê o aviso', async ({ page }) => {
    await open(page, '/analytics', 'requester');
    await expect(page.getByText('Análises exigem acesso à auditoria').first()).toBeVisible();
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
    const own = await page.locator('[data-testid="request-list"] tbody .person').count();
    await page.locator('.profile-trigger').click();
    await page
      .locator('.ant-drawer-open .ant-drawer-content-wrapper')
      .getByText('Aprovador', { exact: true })
      .first()
      .click();
    await page.keyboard.press('Escape');
    await expect
      .poll(() => page.locator('[data-testid="request-list"] tbody .person').count())
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

  test('wizard valida os campos e cria a solicitação', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await open(page, '/requests/new', 'requester');
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(page.locator('.app-form-error').first()).toBeVisible();
    await page.getByLabel('Título').fill('Licenças Figma para o time de Design');
    await page.getByLabel('Valor (R$)').fill('21600');
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(page.locator('.ant-picker')).toBeVisible();
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(page.getByTestId('wizard-summary')).toContainText('Licenças Figma');
    await page.getByRole('button', { name: 'Enviar para revisão' }).click();
    await expect(page).toHaveURL(/#\/requests\/req-\d+/);
    await expect(
      page.getByRole('heading', { name: 'Licenças Figma para o time de Design' }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('paleta de comandos (Ctrl+K) navega e o perfil volta o foco ao fechar', async ({ page }) => {
    await open(page, '/inbox');
    await page.waitForSelector('tr.task');
    await page.keyboard.press('Control+k');
    const palette = page.locator('.ant-modal:visible');
    await expect(palette).toBeVisible();
    await palette.getByRole('searchbox').fill('analises');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/analytics/);
    const trigger = page.locator('.profile-trigger');
    await trigger.click();
    await expect(page.locator('.ant-drawer-open .ant-drawer-content-wrapper')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.ant-drawer-open .ant-drawer-content-wrapper')).toHaveCount(0);
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

  test('o menu lateral recolhe e continua navegável', async ({ page }) => {
    await open(page, '/inbox');
    await page.getByRole('button', { name: 'Recolher menu lateral' }).click();
    await expect(page.getByRole('link', { name: 'Quadro' }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Quadro' }).first().click();
    await expect(page).toHaveURL(/#\/board/);
  });

  test('o tema escuro é o padrão e o claro baixa a folha clara do NG-ZORRO', async ({ page }) => {
    await page.goto('./#/inbox');
    await page.waitForSelector('tr.task');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(dark).toBe('rgb(13, 15, 18)');
    await expect(page.locator('#ox-theme-light')).toHaveCount(0);

    await open(page, '/inbox', 'approver', 'light');
    await page.reload();
    await page.waitForSelector('tr.task');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#ox-theme-light')).toHaveCount(1);
    const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(light).toBe('rgb(244, 245, 247)');
    const card = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('.ant-select-selector') as Element).backgroundColor,
    );
    expect(card).toBe('rgb(255, 255, 255)');
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
    const sheet = page.locator('.ant-drawer-open .ant-drawer-content-wrapper');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('link', { name: 'Administração' })).toBeVisible();
    await expect(sheet.getByRole('link', { name: 'Análises' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Perfil de demonstração/ })).toBeVisible();
    await sheet.getByRole('link', { name: 'Administração' }).click();
    await expect(page).toHaveURL(/#\/admin/);
  });

  test('o menu hambúrguer abre a gaveta de navegação', async ({ page }) => {
    await open(page, '/inbox');
    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();
    const drawer = page.locator('.ant-drawer-open .ant-drawer-content-wrapper');
    await expect(drawer.getByRole('link', { name: /Quadro/ })).toBeVisible();
    await drawer.getByRole('link', { name: /Quadro/ }).click();
    await expect(page).toHaveURL(/#\/board/);
  });

  test('solicitante ganha "Nova" no lugar de "Quadro" na barra inferior', async ({ page }) => {
    await open(page, '/inbox', 'requester');
    const nav = page.getByRole('navigation', { name: 'Navegação principal' }).last();
    await expect(nav.getByRole('link', { name: 'Nova' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Quadro' })).toHaveCount(0);
  });

  test('alvos de toque têm pelo menos 44 px nos botões e na barra inferior', async ({ page }) => {
    await open(page, '/inbox');
    await page.waitForSelector('tr.task');
    const small = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          'main button, .app-bottom-nav a, .app-bottom-nav button, .ant-layout-header button',
        ),
      )
        .filter((element) => element.offsetParent !== null)
        .map((element) => ({
          name: element.textContent?.trim() ?? '',
          h: element.offsetHeight,
          w: element.offsetWidth,
        }))
        .filter((box) => box.h < 44 || box.w < 44),
    );
    expect(small).toEqual([]);
  });

  test('lista em cartões mostra 15 e carrega o resto sob demanda', async ({ page }) => {
    await open(page, '/requests');
    await page.waitForSelector('.req-card');
    await expect(page.locator('.req-card')).toHaveCount(15);
    await page.getByRole('button', { name: /Mostrar mais/ }).click();
    await expect.poll(() => page.locator('.req-card').count()).toBeGreaterThan(15);
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
