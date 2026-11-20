import { createAuditEntry } from '../../domain/audit';
import { Actor, WorkflowAction, WorkflowRequest } from '../../domain/request.model';
import { applyTransition } from '../../domain/workflow-machine';

const HOUR = 3_600_000;

export interface SeedStep {
  readonly action: WorkflowAction;
  readonly actor: Actor;
  /** Horas após a criação em que a ação foi registrada. */
  readonly afterHours: number;
  readonly comment?: string;
}

export interface SeedSpec {
  readonly title: string;
  readonly description: string;
  readonly category: WorkflowRequest['category'];
  readonly priority: WorkflowRequest['priority'];
  readonly amount: number;
  readonly requester: Actor;
  /** Idade da solicitação, em horas, no momento do boot. */
  readonly ageHours: number;
  readonly dueInHours: number;
  readonly documents: readonly string[];
  readonly steps: readonly SeedStep[];
}

export const requester = (name: string): Actor => ({ name, role: 'requester' });
export const ANA = requester('Ana Souza');
export const MARINA = requester('Marina Costa');
const THIAGO = requester('Thiago Ferreira');
const PATRICIA = requester('Patrícia Nogueira');
const RAFAEL = requester('Rafael Duarte');
export const BRUNO: Actor = { name: 'Bruno Lima', role: 'reviewer' };
export const CARLA: Actor = { name: 'Carla Mendes', role: 'approver' };

const submit = (actor: Actor, afterHours: number): SeedStep => ({ action: 'submit', actor, afterHours });

export const SEEDS: readonly SeedSpec[] = [
  {
    title: 'Renovação do AWS Enterprise Support',
    description:
      'Renovação anual do plano Enterprise Support da conta de produção, com reajuste de 6% sobre o contrato vigente. Inclui revisão trimestral de arquitetura e suporte 24x7.',
    category: 'contract',
    priority: 'high',
    amount: 312500,
    requester: MARINA,
    ageHours: 20,
    dueInHours: 96,
    documents: ['proposta-aws-2027.pdf', 'comparativo-planos.xlsx'],
    steps: [submit(MARINA, 2)],
  },
  {
    title: 'Acesso de leitura ao data warehouse para o time de BI',
    description:
      'Liberação do perfil analyst-readonly no BigQuery para 6 analistas do time de BI, com expiração automática em 90 dias.',
    category: 'access',
    priority: 'high',
    amount: 1200,
    requester: ANA,
    ageHours: 30,
    dueInHours: 10,
    documents: ['lista-analistas.csv'],
    steps: [submit(ANA, 1)],
  },
  {
    title: 'Viagem para workshop com cliente em Curitiba',
    description:
      'Três analistas para o workshop de descoberta do projeto de integração fiscal, com passagens, hospedagem por duas noites e traslados.',
    category: 'travel',
    priority: 'low',
    amount: 4380.5,
    requester: THIAGO,
    ageHours: 52,
    dueInHours: -6,
    documents: ['agenda-workshop.pdf'],
    steps: [submit(THIAGO, 3)],
  },
  {
    title: 'Conferência QCon São Paulo: 3 ingressos',
    description:
      'Ingressos para o time de plataforma participar da trilha de arquitetura e confiabilidade. Inclui inscrição antecipada.',
    category: 'travel',
    priority: 'medium',
    amount: 11970,
    requester: PATRICIA,
    ageHours: 14,
    dueInHours: 30,
    documents: ['programacao-qcon.pdf'],
    steps: [submit(PATRICIA, 1)],
  },
  {
    title: 'Monitores 27" para o home office',
    description:
      'Compra de 8 monitores 27" 4K para o time remoto, conforme política de equipamentos. Entrega no endereço de cada colaborador.',
    category: 'purchase',
    priority: 'medium',
    amount: 14200,
    requester: ANA,
    ageHours: 60,
    dueInHours: 72,
    documents: ['cotacao-dell.pdf'],
    steps: [
      submit(ANA, 2),
      { action: 'return', actor: BRUNO, afterHours: 9, comment: 'Anexe ao menos três cotações para comparação.' },
    ],
  },
  {
    title: 'Contrato de suporte do ERP',
    description:
      'Renovação do contrato de suporte e manutenção do ERP por 12 meses, com SLA de atendimento crítico em 2 horas.',
    category: 'contract',
    priority: 'high',
    amount: 184000,
    requester: RAFAEL,
    ageHours: 70,
    dueInHours: 48,
    documents: ['minuta-contrato.pdf', 'parecer-juridico.pdf'],
    steps: [
      submit(RAFAEL, 2),
      { action: 'approve', actor: CARLA, afterHours: 26, comment: 'Aprovado conforme parecer jurídico.' },
    ],
  },
  {
    title: 'Notebooks para o onboarding do Q4',
    description:
      'Aquisição de 12 notebooks para as novas contratações do último trimestre, já com licença do sistema operacional e seguro.',
    category: 'purchase',
    priority: 'medium',
    amount: 96800,
    requester: MARINA,
    ageHours: 200,
    dueInHours: -80,
    documents: ['cotacao-notebooks.pdf'],
    steps: [
      submit(MARINA, 2),
      { action: 'approve', actor: CARLA, afterHours: 30 },
      { action: 'complete', actor: CARLA, afterHours: 96, comment: 'Equipamentos entregues e inventariados.' },
    ],
  },
  {
    title: 'Pentest anual da plataforma de pagamentos',
    description:
      'Contratação de teste de intrusão externo e interno, com relatório executivo e reteste das vulnerabilidades críticas.',
    category: 'contract',
    priority: 'high',
    amount: 78000,
    requester: RAFAEL,
    ageHours: 120,
    dueInHours: -20,
    documents: ['escopo-pentest.pdf'],
    steps: [
      submit(RAFAEL, 4),
      {
        action: 'reject',
        actor: BRUNO,
        afterHours: 40,
        comment: 'Escopo duplica o pentest já contratado no trimestre. Reaproveite o fornecedor atual.',
      },
    ],
  },
  {
    title: 'Licenças JetBrains para o squad Pagamentos',
    description:
      'Renovação de 14 licenças anuais do pacote All Products para o squad de Pagamentos.',
    category: 'purchase',
    priority: 'medium',
    amount: 18640,
    requester: ANA,
    ageHours: 6,
    dueInHours: 120,
    documents: ['orcamento-jetbrains.pdf'],
    steps: [],
  },
  {
    title: 'VPN para consultoria externa de segurança',
    description:
      'Acesso VPN temporário (30 dias) para dois consultores externos acompanharem a auditoria de segurança.',
    category: 'access',
    priority: 'low',
    amount: 450,
    requester: THIAGO,
    ageHours: 3,
    dueInHours: 200,
    documents: [],
    steps: [],
  },
];

export function seedRequest(spec: SeedSpec, index: number, now: Date): WorkflowRequest {
  const id = `req-${index + 1}`;
  const createdAt = new Date(now.getTime() - spec.ageHours * HOUR);
  const draft: WorkflowRequest = {
    id,
    code: `OPS-${String(index + 1).padStart(4, '0')}`,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    priority: spec.priority,
    amount: spec.amount,
    requester: spec.requester.name,
    status: 'draft',
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    dueAt: new Date(now.getTime() + spec.dueInHours * HOUR).toISOString(),
    documents: spec.documents,
    audit: [creationEntry(id, spec.requester, createdAt)],
  };
  return spec.steps.reduce((request, step) => {
    const at = new Date(createdAt.getTime() + step.afterHours * HOUR);
    const result = applyTransition(request, step.action, { ...step, now: at });
    return result.ok ? result.value : request;
  }, draft);
}

export function creationEntry(id: string, actor: Actor, at: Date) {
  return createAuditEntry(`${id}-1`, { actor, action: 'create', from: null, to: 'draft', at });
}

