import { Actor, WorkflowRequest } from '../../domain/request.model';
import { ANA, BRUNO, CARLA, MARINA, SeedSpec, SeedStep, requester } from './seed-data';

/** PRNG determinístico: o histórico é o mesmo a cada carga. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Category = WorkflowRequest['category'];

const POOL_REQUESTERS: readonly Actor[] = [
  MARINA,
  ANA,
  requester('Thiago Ferreira'),
  requester('Patrícia Nogueira'),
  requester('Rafael Duarte'),
  requester('Lucas Andrade'),
];

const POOL_TITLES: Readonly<Record<Category, readonly string[]>> = {
  purchase: [
    'Assinatura anual do Notion para o time de Produto',
    'Cadeiras ergonômicas para o escritório de São Paulo',
    'Headsets para a equipe de suporte',
    'Servidor de homologação para o time de dados',
    'Kit de onboarding para novos analistas',
    'Licenças Figma para o time de Design',
  ],
  travel: [
    'Visita técnica ao cliente em Porto Alegre',
    'Congresso de segurança em Florianópolis',
    'Reunião de planejamento em Recife',
    'Treinamento de certificação em Belo Horizonte',
  ],
  access: [
    'Acesso de produção para o time de SRE',
    'Perfil de leitura no ERP financeiro',
    'Acesso ao GitLab para consultoria externa',
    'Liberação do painel de observabilidade',
  ],
  contract: [
    'Aditivo do contrato de nuvem',
    'Renovação do seguro cibernético',
    'Contrato de licenciamento do Figma Enterprise',
    'Prestação de serviços de auditoria externa',
  ],
};

const AMOUNT_RANGE: Readonly<Record<Category, readonly [number, number]>> = {
  purchase: [3200, 64000],
  travel: [1800, 12500],
  access: [300, 4800],
  contract: [28000, 260000],
};

const CATEGORY_KEYS: readonly Category[] = ['purchase', 'travel', 'access', 'contract'];
const PRIORITY_KEYS = ['low', 'medium', 'high'] as const;
const HISTORY_SIZE = 30;
const DAY_HOURS = 24;
const MAX_AGE_DAYS = 56;
const MIN_CLOSED_AGE = 36;

type Outcome = 'completed' | 'approved' | 'rejected' | 'in_review' | 'returned' | 'draft';

/** Pesos por repetição: a maioria conclui, uma parte rejeita e o resto segue em aberto. */
const OUTCOMES: readonly Outcome[] = [
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'approved',
  'rejected',
  'rejected',
  'in_review',
  'in_review',
  'returned',
  'draft',
];

function historySteps(
  outcome: Outcome,
  owner: Actor,
  age: number,
  rand: () => number,
  window: number,
): SeedStep[] {
  if (outcome === 'draft') return [];
  const submitAt = Math.min(age - 0.5, 1 + rand() * 5);
  const submit: SeedStep = { action: 'submit', actor: owner, afterHours: submitAt };
  if (outcome === 'in_review') return [submit];
  if (outcome === 'returned') {
    const returnAt = Math.min(age - 0.25, submitAt + 4 + rand() * 20);
    return [
      submit,
      {
        action: 'return',
        actor: BRUNO,
        afterHours: returnAt,
        comment: 'Detalhe o escopo e anexe a cotação.',
      },
    ];
  }
  const decideAt = Math.min(age - 0.25, submitAt + 6 + rand() * 66);
  if (outcome === 'rejected') {
    return [
      submit,
      {
        action: 'reject',
        actor: BRUNO,
        afterHours: decideAt,
        comment: 'Fora do orçamento aprovado para o trimestre.',
      },
    ];
  }
  const approve: SeedStep = {
    action: 'approve',
    actor: CARLA,
    afterHours: decideAt,
    ...(decideAt > window ? { comment: 'Aprovado fora do prazo, com ciência da gestão.' } : {}),
  };
  if (outcome === 'approved') return [submit, approve];
  const completeAt = Math.min(age, decideAt + 8 + rand() * 40);
  return [
    submit,
    approve,
    {
      action: 'complete',
      actor: CARLA,
      afterHours: completeAt,
      comment: 'Concluído e registrado.',
    },
  ];
}

/** Solicitações antigas que dão volume às análises (vazão, SLA e gargalos). */
export function generateHistory(): SeedSpec[] {
  const rand = mulberry32(20261119);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
  return Array.from({ length: HISTORY_SIZE }, () => {
    const category = pick(CATEGORY_KEYS);
    const outcome = pick(OUTCOMES);
    const open = outcome === 'in_review' || outcome === 'returned' || outcome === 'draft';
    const age = open
      ? 10 + rand() * 60
      : MIN_CLOSED_AGE + rand() * (MAX_AGE_DAYS * DAY_HOURS - MIN_CLOSED_AGE);
    const window = DAY_HOURS * (1 + Math.floor(rand() * 5));
    const owner = pick(POOL_REQUESTERS);
    const [min, max] = AMOUNT_RANGE[category];
    return {
      title: pick(POOL_TITLES[category]),
      description: 'Solicitação do histórico, gerada para compor as análises da demonstração.',
      category,
      priority: pick(PRIORITY_KEYS),
      amount: Math.round((min + rand() * (max - min)) / 10) * 10,
      requester: owner,
      ageHours: age,
      dueInHours: window - age,
      documents: rand() > 0.5 ? ['orcamento.pdf'] : [],
      steps: historySteps(outcome, owner, age, rand, window),
    };
  });
}

export interface SeedComment {
  readonly requestId: string;
  readonly author: Actor;
  readonly hoursAgo: number;
  readonly body: string;
}

const BRUNO_REVIEWER: Actor = BRUNO;

export const SEED_COMMENTS: readonly SeedComment[] = [
  {
    requestId: 'req-1',
    author: MARINA,
    hoursAgo: 18,
    body: 'Anexei a proposta comparando os planos Business e Enterprise. O reajuste de 6% está dentro do índice acordado.',
  },
  {
    requestId: 'req-1',
    author: BRUNO_REVIEWER,
    hoursAgo: 12,
    body: 'Revisei o escopo: inclui a revisão trimestral de arquitetura. Pode seguir para aprovação.',
  },
  {
    requestId: 'req-2',
    author: ANA,
    hoursAgo: 28,
    body: 'Os seis analistas estão listados no CSV anexo. O acesso expira em 90 dias.',
  },
  {
    requestId: 'req-5',
    author: BRUNO_REVIEWER,
    hoursAgo: 50,
    body: 'Preciso de ao menos três cotações para comparar antes de aprovar.',
  },
  {
    requestId: 'req-5',
    author: ANA,
    hoursAgo: 40,
    body: 'Vou pedir mais duas cotações aos fornecedores e reenvio ainda hoje.',
  },
];
