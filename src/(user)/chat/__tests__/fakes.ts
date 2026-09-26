import type { ServicoCampanha } from '../services/campanha'
import type { RegraCampanha, RespostaChat, ResultadoSimulacao } from '../types'

export function regraBlackFriday(sobrescrever: Partial<Record<string, unknown>> = {}): RegraCampanha {
  const valores: Record<string, unknown> = {
    periodo: { data_inicio: '2025-11-24', data_fim: '2025-11-30' },
    pct_acrescimo: 1,
    marcas_alvo: ['ALL'],
    cargos_alvo: ['100', '200', '300'],
    meta_vendas: 2_000_000,
    orcamento_limite: 30_000,
    ...sobrescrever,
  }
  const tipos: Record<string, [string, 'REGRA' | 'CONSTRAINT']> = {
    periodo: ['date_range', 'REGRA'],
    pct_acrescimo: ['percentage', 'REGRA'],
    marcas_alvo: ['multi_select', 'REGRA'],
    cargos_alvo: ['multi_select', 'REGRA'],
    meta_vendas: ['currency', 'CONSTRAINT'],
    orcamento_limite: ['currency', 'CONSTRAINT'],
  }
  return {
    rule_id: 'draft-1', tipo_regra: 'BONUS_TEMPORARIO', raw_prompt: 'Black Friday +1%',
    status: 'DRAFT_PENDING_REVIEW', faltantes: [],
    parametros: Object.entries(tipos).map(([key, [type, categoria]]) => ({
      key, label: key, type: type as never, categoria, required: true,
      value: valores[key] as never,
      options: key === 'marcas_alvo'
        ? [{ id: 'ALL', label: 'Todas as Marcas' }, { id: '10', label: 'PRETO (10)' }, { id: '30', label: 'AZUL (30)' }]
        : null,
    })),
  }
}

export function resultadoBlackFriday(cabe = true): ResultadoSimulacao {
  return {
    rule_id: 'draft-1', competencias: ['2025-11'],
    totais: { baseline: 480263.24, simulado: 503999.41, diferenca: 23736.17, diferenca_pct: 4.94 },
    por_marca: [{ codigo: '10', baseline: 1, simulado: 2, diferenca: 1 }, { codigo: '20', baseline: 1, simulado: 1, diferenca: 0 }],
    por_cargo: [{ codigo: '150', baseline: 1, simulado: 1, diferenca: 0 }],
    orcamento: cabe
      ? { orcamento_limite: 30000, custo_incremental: 23736.17, folga: 6263.83, cabe_no_orcamento: true }
      : { orcamento_limite: 20000, custo_incremental: 23736.17, folga: -3736.17, cabe_no_orcamento: false },
    meta: { meta_vendas: 2000000, vendas_periodo: 2406125.93, pct_atingimento: 120.31, atingida: true },
    codigo: 'def aplicar_regra(bases, apuracao_base, competencias): ...',
    origem_codigo: 'llm', tentativas: 1, explicacao: 'Cabe no **orçamento**.',
  }
}

/** Serviço de campanha em memória: registra as chamadas e devolve respostas programadas. */
export class FakeServicoCampanha implements ServicoCampanha {
  conversas: Array<{ chatId: string; mensagem: string }> = []
  simulacoes: RegraCampanha[] = []
  respostaChat: RespostaChat = { chat_id: 'c', response: 'Anotado!', regra: regraBlackFriday() }
  resultado: ResultadoSimulacao = resultadoBlackFriday()
  falha: unknown = null

  async conversar(chatId: string, mensagem: string): Promise<RespostaChat> {
    this.conversas.push({ chatId, mensagem })
    if (this.falha) throw this.falha
    return this.respostaChat
  }

  async simular(_chatId: string, regra: RegraCampanha): Promise<ResultadoSimulacao> {
    // JSON e não structuredClone: a regra chega como Proxy reativo do Vue.
    this.simulacoes.push(JSON.parse(JSON.stringify(regra)) as RegraCampanha)
    if (this.falha) throw this.falha
    return this.resultado
  }
}
