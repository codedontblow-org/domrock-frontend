import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ServicoCampanha } from '../services/campanha'
import type {
  FalhaSimulacao, RegraCampanha, RespostaChat, ResultadoSimulacao, SimulacaoAndamento, SimulacaoCriada,
} from '../types'

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
    impacto: { pessoas_impactadas: 312, pessoas_total: 548, media_por_pessoa: 76.08, maior_acrescimo: 402.5 },
    maiores_lojas: [{ codigo: '13', baseline: 1, simulado: 2, diferenca: 2140.1 }],
    cenarios: [
      {
        tipo: 'ajustar_acrescimo', titulo: 'Acréscimo menor, dentro do orçamento', pct_acrescimo: 0.84,
        marcas_alvo: ['10', '20', '30', '40', '50', '60'], custo_incremental: 19938.37, economia: 3797.8,
        cabe_no_orcamento: true,
      },
      {
        tipo: 'sem_marca', titulo: 'Sem a marca Preto', pct_acrescimo: 1,
        marcas_alvo: ['20', '30', '40', '50', '60'], custo_incremental: 4398.31, economia: 19337.86,
        cabe_no_orcamento: true,
      },
    ],
    ressalvas: ['Simulação sobre vendas que já aconteceram.'],
    codigo: 'def aplicar_regra(bases, apuracao_base, competencias): ...',
    origem_codigo: 'llm', tentativas: 1, explicacao: 'Cabe no **orçamento**.',
  }
}

/** Serviço de campanha em memória: registra as chamadas e devolve respostas programadas. */
export class FakeServicoCampanha implements ServicoCampanha {
  conversas: Array<{ chatId: string; mensagem: string; regra: RegraCampanha | null }> = []
  simulacoes: RegraCampanha[] = []
  respostaChat: RespostaChat = { chat_id: 'c', response: 'Anotado!', regra: regraBlackFriday() }
  resultado: ResultadoSimulacao = resultadoBlackFriday()
  falha: unknown = null
  /** Etapas que o "backend" anuncia durante a simulação, na ordem. */
  etapas: string[] = []
  /** Com true, a simulação fica rodando até o teste chamar liberarSimulacao(). */
  segurarSimulacao = false
  private liberar: (() => void) | null = null

  async conversar(chatId: string, mensagem: string, regra: RegraCampanha | null): Promise<RespostaChat> {
    this.conversas.push({ chatId, mensagem, regra: regra ? JSON.parse(JSON.stringify(regra)) : null })
    if (this.falha) throw this.falha
    return this.respostaChat
  }

  async simular(_chatId: string, regra: RegraCampanha, aoMudarEtapa: (etapa: string) => void): Promise<ResultadoSimulacao> {
    // JSON e não structuredClone: a regra chega como Proxy reativo do Vue.
    this.simulacoes.push(JSON.parse(JSON.stringify(regra)) as RegraCampanha)
    this.etapas.forEach((etapa) => aoMudarEtapa(etapa))
    if (this.segurarSimulacao) await new Promise<void>((resolve) => { this.liberar = resolve })
    if (this.falha) throw this.falha
    return this.resultado
  }

  liberarSimulacao(): void {
    this.liberar?.()
  }
}

export const jobCriado: SimulacaoCriada = { id: 345, status: 'PENDENTE', etapa: 'Na fila' }

const camposDoJob = {
  id: 345, chat_id: 'c1', campanha_id: null, criada_em: '2026-10-21T12:58:40Z', ficha: regraBlackFriday(),
}

export function jobRodando(): SimulacaoAndamento {
  return { ...camposDoJob, status: 'RODANDO', etapa: 'Simulando', concluida_em: null, duracao_ms: null, resultado: null, erro: null }
}

export function jobConcluido(): SimulacaoAndamento {
  return {
    ...camposDoJob, status: 'CONCLUIDA', etapa: 'Concluída', concluida_em: '2026-10-21T12:59:40Z', duracao_ms: 60000,
    resultado: resultadoBlackFriday(), erro: null,
  }
}

export function jobComErro(erro: FalhaSimulacao): SimulacaoAndamento {
  return {
    ...camposDoJob, status: 'ERRO', etapa: 'Erro', concluida_em: '2026-10-21T12:59:40Z', duracao_ms: null,
    resultado: null, erro,
  }
}

/**
 * Backend da simulação em memória (contrato 4.1 e 4.2): o POST devolve o job criado e cada GET
 * devolve o próximo estado de `estados`. Registra os pedidos para o teste conferir rota e corpo.
 */
export class FakeBackendSimulacao {
  pedidos: Array<{ metodo: string; url: string; corpo: unknown }> = []
  private readonly criado: SimulacaoCriada
  private readonly estados: SimulacaoAndamento[]

  constructor(criado: SimulacaoCriada, estados: SimulacaoAndamento[]) {
    this.criado = criado
    this.estados = [...estados]
  }

  http(): AxiosInstance {
    return axios.create({ adapter: (config) => this.responder(config as InternalAxiosRequestConfig) })
  }

  private async responder(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
    const corpo: unknown = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    this.pedidos.push({ metodo: config.method ?? '', url: config.url ?? '', corpo })
    const ehPedido = config.method === 'post'
    const data = ehPedido ? this.criado : this.estados.shift()
    return { status: ehPedido ? 202 : 200, statusText: '', headers: {}, config, data }
  }
}

/** Espera do polling sem relógio: registra os intervalos pedidos e volta na hora. */
export class FakeEspera {
  esperas: number[] = []

  readonly esperar = async (ms: number): Promise<void> => {
    this.esperas.push(ms)
  }
}
