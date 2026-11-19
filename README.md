# OpsFlow · Enterprise Workflow & Approval Console

Console de workflow com etapas rastreáveis, permissões por papel, trilha de auditoria imutável e suporte multilíngue (pt-BR/en). Dados 100% fictícios; a API é simulada no navegador.

## Telas

Console com sidebar, barra superior com busca e menu de perfil de demonstração (papel, idioma, tema e falhas simuladas da API). No celular, a navegação vira barra inferior e a tabela vira lista de cards. Capturas em desktop (1440x900) e celular (390x844), com os dados fictícios de exemplo.

![Lista de solicitações com status, prioridade e SLA](docs/prints/opsflow-lista-solicitacoes-desktop.webp)

![Lista de solicitações no tema escuro](docs/prints/opsflow-lista-escuro-desktop.webp)

![Detalhe de uma solicitação aprovada, com decisão contextual e linha do tempo de auditoria](docs/prints/opsflow-detalhe-auditoria-desktop.webp)

![Wizard de nova solicitação, etapa de detalhes](docs/prints/opsflow-wizard-detalhes-desktop.webp)

![Wizard de nova solicitação, etapa de revisão](docs/prints/opsflow-wizard-revisao-desktop.webp)

<img src="docs/prints/opsflow-lista-solicitacoes-mobile.webp" alt="Lista de solicitações no celular" width="260"> <img src="docs/prints/opsflow-detalhe-auditoria-mobile.webp" alt="Detalhe com auditoria no celular" width="260">

## Design

O visual usa os tokens do design system Nasck UI (cores, espaçamento, raio, sombra, tipografia e movimento), copiados sem alteração para `src/styles/tokens.css` (origem e commit no cabeçalho do arquivo). O que o Nasck UI ainda não define (medidas do shell, aliases de superfície por tema) fica em `src/styles/base.scss`, com prefixo `--ox-`. Tema claro e escuro, foco visível, contraste AA, link de pular para o conteúdo e `prefers-reduced-motion` respeitado.

## Stack

Angular 22 (standalone, signals, zoneless, control flow `@if/@for`), formulários reativos tipados, RxJS (busca com debounce e cancelamento via `switchMap`), Angular CDK (`LiveAnnouncer`, `Overlay`, `TrapFocus`), Vitest.

## Máquina de estados

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> in_review: submit (solicitante)
  in_review --> returned: return (revisor, comentário obrigatório)
  returned --> in_review: resubmit (solicitante)
  in_review --> approved: approve (aprovador; fora do SLA exige justificativa)
  in_review --> rejected: reject (revisor/aprovador, comentário obrigatório)
  approved --> completed: complete (aprovador/admin)
  rejected --> [*]
  completed --> [*]
```

Guardas: permissão do papel, estado de origem, segregação de funções (quem criou não decide) e SLA.

## Matriz RBAC

| Permissão | Solicitante | Revisor | Aprovador | Auditor | Admin |
|---|:-:|:-:|:-:|:-:|:-:|
| request.create / submit | ✓ | | | | ✓ |
| request.return | | ✓ | | | ✓ |
| request.approve | | | ✓ | | ✓ |
| request.reject | | ✓ | ✓ | | ✓ |
| request.complete | | | ✓ | | ✓ |
| audit.view | | ✓ | ✓ | ✓ | ✓ |

Testada por tabela em `src/app/domain/permissions.spec.ts`.

## Migração de legado

`src/app/domain/legacy-adapter.ts` converte o JSON do sistema antigo (`STATUS_CD`, datas `dd/mm/aaaa`, valores `1.234,56`) para o domínio novo, validando cada campo e registrando a migração na auditoria.

## Como rodar

```bash
npm ci
npm start        # http://localhost:4200
npx ng test      # testes unitários (Vitest)
npm run build
npm run lint     # ESLint (angular-eslint, configuração flat)
```

### Build portátil (qualquer subcaminho)

```bash
npm run build:portable   # gera dist-portable/ (configuração "portable": base href ./)
```

A pasta usa caminhos relativos e roteamento por hash, então funciona servida em qualquer subcaminho,
por exemplo `/projetos/opsflow/`. O deploy do Pages continua usando `--base-href /opsflow/`.

## Licença

MIT
