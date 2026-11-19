import { LegacyRequest } from '../../domain/legacy-adapter';

/** Exportação fictícia do sistema legado, migrada via adapter no boot do mock. */
export const LEGACY_EXPORT: readonly LegacyRequest[] = [
  {
    REQ_ID: 812,
    TITULO: 'Renovação do contrato de limpeza',
    DESCR: 'Renovação anual com reajuste pelo IPCA.',
    TIPO: 'CONTRATO',
    STATUS_CD: 'CONC',
    PRIORIDADE: 2,
    VALOR: '48.900,00',
    SOLICITANTE: 'Fernanda Alves',
    DT_CRIACAO: '02/09/2026',
    DT_LIMITE: '30/09/2026',
    ANEXOS: 'contrato-2026.pdf;aditivo.pdf',
  },
  {
    REQ_ID: 815,
    TITULO: 'Viagem para auditoria em Recife',
    TIPO: 'VIAGEM',
    STATUS_CD: 'REJ',
    PRIORIDADE: 3,
    VALOR: '3.250,40',
    SOLICITANTE: 'Gustavo Reis',
    DT_CRIACAO: '15/10/2026',
    DT_LIMITE: '25/10/2026',
  },
  {
    REQ_ID: 999,
    TITULO: 'Registro corrompido',
    TIPO: 'DESCONHECIDO',
    STATUS_CD: 'XX',
    PRIORIDADE: 7,
    VALOR: 'abc',
    SOLICITANTE: 'Sistema',
    DT_CRIACAO: '31/02/2026',
    DT_LIMITE: '31/02/2026',
  },
];
