import type { ResultadoSimulacao } from '../../chat/types'
import type { StatusCampanha } from '../types'

export function resultadoBlackFridayMock(): ResultadoSimulacao {
  return {
    rule_id: 'draft-1',
    competencias: ['2025-11'],
    totais: { baseline: 480263.24, simulado: 503999.34, diferenca: 23736.1, diferenca_pct: 4.94 },
    por_marca: [
      { codigo: '10', baseline: 1, simulado: 2, diferenca: 1 },
      { codigo: '20', baseline: 1, simulado: 1, diferenca: 0 },
    ],
    por_cargo: [{ codigo: '150', baseline: 1, simulado: 1, diferenca: 0 }],
    orcamento: {
      orcamento_limite: 30000,
      custo_incremental: 23736.1,
      folga: 6263.9,
      cabe_no_orcamento: true,
    },
    meta: {
      meta_vendas: 2000000,
      vendas_periodo: 2406125.93,
      pct_atingimento: 120.31,
      atingida: true,
    },
    impacto: {
      pessoas_impactadas: 312,
      pessoas_total: 548,
      media_por_pessoa: 76.08,
      maior_acrescimo: 402.5,
    },
    maiores_lojas: [{ codigo: '13', baseline: 1, simulado: 2, diferenca: 2140.1 }],
    cenarios: [],
    ressalvas: ['Simulação sobre vendas que já aconteceram.'],
    codigo: 'def aplicar_regra(bases, apuracao_base, competencias): ...',
    origem_codigo: 'llm',
    tentativas: 1,
    explicacao: 'Cabe no orçamento.',
  }
}

export const STATUS_LABELS: Record<StatusCampanha, string> = {
  RASCUNHO: 'Rascunho',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  APROVADA: 'Aprovada',
  REPROVADA: 'Reprovada',
  ARQUIVADA: 'Arquivada',
}
