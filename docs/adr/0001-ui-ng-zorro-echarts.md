# ADR 0001: UI com NG-ZORRO, ECharts e uma camada de wrappers própria

- **Data:** 2026-11-20
- **Estado:** aceita

## Contexto

O dono do projeto não gostou do design feito à mão e determinou o padrão de UI dos apps do portfólio: Ant Design (no Angular, NG-ZORRO), Apache ECharts para gráficos, wrappers próprios para isolar a biblioteca, tema central com a identidade de cada app e Storybook com todos os componentes.

## Verificação de compatibilidade (feita antes de instalar)

| Pacote | Versão | Peer dependencies | Licença |
|---|---|---|---|
| `ng-zorro-antd` | 22.2.0 (publicada em 2026-11-04) | `@angular/core`, `forms`, `common`, `router`, `platform-browser` em `^22.0.0` | MIT |
| `ngx-echarts` | 22.0.0 | `@angular/core >=22.0.0`, `echarts >=5.0.0` | MIT |
| `echarts` | 6.1.0 | nenhuma | Apache-2.0 |
| `@storybook/angular` | 10.6.8 | `@angular/core >=18.0.0 <23.0.0` | MIT |

O projeto usa Angular 22.3.0. As peers pedem `^22.0.0`, então **há versão do NG-ZORRO compatível com o Angular 22 e nenhuma migração (`ng update`) nem downgrade foi necessário**. A regra do padrão ("se não houver compatibilidade, use a versão mais nova do Angular suportada") não precisou ser aplicada.

## Decisões

1. **Versões exatas** no `package.json` (sem `^` nem `~`), inclusive as dependências que já existiam.
2. **Tema por Less, não por tokens.** O NG-ZORRO 22 ainda é o Ant Design v4 em Less (não tem `ConfigProvider` com tokens). A identidade do OpsFlow entra por `src/styles/overrides-*.less`, importado depois do tema do NG-ZORRO (em Less, a última definição de cada variável vale). Há duas folhas compiladas (`theme-light` e `theme-dark`), só com os componentes usados; o `UiTheme` ativa uma e desativa a outra (`media`). Isso custa cerca de 40 kB transferidos a mais (a folha do tema inativo também é baixada, com baixa prioridade).
3. **Fonte única das cores.** `src/styles/tokens.scss` guarda as cores (CSS custom properties) usadas por wrappers, gráficos e peças próprias. Um teste (`theme-contrast.spec.ts`) lê esse arquivo e os `overrides-*.less`, calcula o contraste WCAG de cada par nos dois temas e garante que as variáveis do NG-ZORRO batem com os tokens.
4. **Primário de botão `#2a63f0`, marca `#2f6bff`.** Branco sobre `#2f6bff` dá 4,4988:1 (abaixo de 4,5). O botão usa `#2a63f0` (5,07:1); o logo e os gráficos mantêm o tom da marca.
5. **Wrappers em `src/app/ui/`.** As telas só importam de lá. O ESLint (`no-restricted-imports`) barra `ng-zorro-antd`, `echarts`, `ngx-echarts` e `@ant-design/icons-angular` fora dessa pasta. Os inputs seguem os nomes das props dos wrappers React (por exemplo, `AppButton`: `variant`, `size`, `loading`, `disabled`, `icon`, `danger`).
6. **Bundle.** `"sideEffects": false` e import por componente deixam as rotas carregarem só o que usam; o ECharts é registrado de forma enxuta (`echarts/core` com barras, linha, pizza, grade, tooltip, legenda e renderer SVG) dentro do `app-chart`, que só existe no chunk das análises.
7. **Ícones.** Só os ícones usados são registrados (`provideNzIcons`).
8. **Storybook 10 (webpack).** O `@storybook/angular` usa o builder webpack e pede `@angular-devkit/build-angular`, `@angular/platform-browser-dynamic`, `@angular/animations` e `zone.js` (dependências de desenvolvimento). O app em si continua zoneless; o Storybook roda com `experimentalZoneless`.

## Consequências

- Bundle inicial maior que o do design à mão (ver o README, com os números antes e depois): o custo do NG-ZORRO e das duas folhas de tema.
- `npm audit --omit=dev` fecha com 0 vulnerabilidades. O `npm audit` completo aponta 5 (2 moderadas, 3 altas) em dependências **só de desenvolvimento** do builder do Storybook (`webpack-dev-middleware` e `minimatch`); a correção exigiria forçar uma versão major do Storybook, e elas não entram no que vai para produção.
- O tema escuro do Storybook não alterna: o Storybook carrega só a folha clara.

## Alternativas descartadas

- **PrimeNG 22+:** fora da licença permitida.
- **Tema pelas variáveis CSS do NG-ZORRO (`ng-zorro-antd.variable`):** só cobre as cores semânticas; texto e fundos continuam fixos, e não existe versão escura com variáveis.
- **Importar o NG-ZORRO direto nas telas:** perde o isolamento e o contrato único entre os frameworks.
