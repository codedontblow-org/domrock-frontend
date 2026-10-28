import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ServicoCampanha } from '../services/campanha'
import type {
  CampanhaSalva, ComissaoNoTrecho, ConflitoCampanha, ConversaGravada, FalhaSimulacao, MensagemGravada, RegraCampanha, RespostaChat,
  ResultadoSimulacao, SimulacaoAndamento, SimulacaoConcluida, SimulacaoCriada,
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
    meta: metaDaBlackFriday(2_000_000),
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

const VENDA_BLACK_FRIDAY = 2406125.93

function metaDaBlackFriday(metaVendas: number): ResultadoSimulacao['meta'] {
  const pct = Math.round((VENDA_BLACK_FRIDAY / metaVendas) * 10000) / 100
  const diferenca = Math.round((VENDA_BLACK_FRIDAY - metaVendas) * 100) / 100
  return { meta_vendas: metaVendas, vendas_periodo: VENDA_BLACK_FRIDAY, pct_atingimento: pct, atingida: pct >= 100, diferenca }
}

export type CasoDoCriterio = 'sem_orcamento' | 'orcamento_20_mil' | 'meta_3_milhoes'

/** Os três casos dos critérios do A6-72: Black Friday +1%, custo de R$ 23.736,10. */
export function resultadoDoCriterio(caso: CasoDoCriterio): ResultadoSimulacao {
  const comOrcamento = caso === 'orcamento_20_mil'
  const meta = metaDaBlackFriday(caso === 'meta_3_milhoes' ? 3_000_000 : 2_000_000)
  const semMarca = {
    tipo: 'sem_marca' as const, titulo: 'Sem a marca Preto', pct_acrescimo: 1, marcas_alvo: ['20', '30', '40', '50', '60'],
    custo_incremental: 4398.28, economia: 19337.82, cabe_no_orcamento: comOrcamento ? true : null,
  }
  const maiorQueCabe = {
    tipo: 'ajustar_acrescimo' as const, titulo: 'Acréscimo menor, dentro do orçamento', pct_acrescimo: 0.84,
    marcas_alvo: ['10', '20', '30', '40', '50', '60'], custo_incremental: 19938.34, economia: 3797.76, cabe_no_orcamento: true,
  }
  return {
    ...resultadoBlackFriday(),
    totais: { baseline: 480263.24, simulado: 503999.34, diferenca: 23736.1, diferenca_pct: 4.94 },
    meta,
    orcamento: comOrcamento
      ? { orcamento_limite: 20000, custo_incremental: 23736.1, folga: -3736.1, cabe_no_orcamento: false }
      : null,
    cenarios: comOrcamento ? [maiorQueCabe, semMarca] : [semMarca],
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
  /** Id do próximo job de simulação; cada simulação soma 1. */
  proximaSimulacaoId = 345
  salvamentos: Array<{ chatId: string; simulacaoId: number; nome: string }> = []
  submissoes: number[] = []
  chatsConsultados: string[] = []
  conversaGravada: ConversaGravada = {
    chat_id: 'chat-da-gabriela',
    campanha_id: 12,
    mensagens: [
      { id: 101, papel: 'usuario', texto: 'Quero +1%', criada_em: '2026-10-21T12:58:10Z' },
      { id: 102, papel: 'lana', texto: 'Preenchi a ficha', regra: regraBlackFriday(), trilha: null, criada_em: '2026-10-21T12:58:14Z' },
    ],
  }
  falhaBuscarMensagens: unknown = null
  /** Falha do próximo submeter (só dele), para testar a nova tentativa. */
  falhaSubmeter: unknown = null
  segurarConversar = false
  liberarConversar: (() => void) | null = null
  private liberar: (() => void) | null = null

  async buscarMensagens(chatId: string): Promise<ConversaGravada> {
    this.chatsConsultados.push(chatId)
    if (this.falhaBuscarMensagens) throw this.falhaBuscarMensagens
    if (this.falha) throw this.falha
    return { ...this.conversaGravada, chat_id: chatId }
  }

  async conversar(chatId: string, mensagem: string, regra: RegraCampanha | null): Promise<RespostaChat> {
    this.conversas.push({ chatId, mensagem, regra: regra ? JSON.parse(JSON.stringify(regra)) : null })
    if (this.segurarConversar) await new Promise<void>((resolve) => { this.liberarConversar = resolve })
    if (this.falha) throw this.falha
    return this.respostaChat
  }

  async simular(_chatId: string, regra: RegraCampanha, aoMudarEtapa: (etapa: string) => void): Promise<SimulacaoConcluida> {
    // JSON e não structuredClone: a regra chega como Proxy reativo do Vue.
    this.simulacoes.push(JSON.parse(JSON.stringify(regra)) as RegraCampanha)
    this.etapas.forEach((etapa) => aoMudarEtapa(etapa))
    if (this.segurarSimulacao) await new Promise<void>((resolve) => { this.liberar = resolve })
    if (this.falha) throw this.falha
    return { id: this.proximaSimulacaoId++, resultado: this.resultado }
  }

  async buscarSimulacao(id: number): Promise<SimulacaoAndamento> {
    if (this.falha) throw this.falha
    return { ...jobConcluido(), id, chat_id: 'chat-da-gabriela' }
  }

  async salvarCampanha(chatId: string, simulacaoId: number, nome: string): Promise<CampanhaSalva> {
    this.salvamentos.push({ chatId, simulacaoId, nome })
    if (this.falha) throw this.falha
    return { id: 12, nome, status: 'RASCUNHO', versao_atual: null }
  }

  async submeter(campanhaId: number): Promise<CampanhaSalva> {
    this.submissoes.push(campanhaId)
    const falha = this.falhaSubmeter
    this.falhaSubmeter = null
    if (falha) throw falha
    return { id: campanhaId, nome: 'Natal 2025', status: 'AGUARDANDO_APROVACAO', versao_atual: 1 }
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

export function exemplo2Contrato(): { comissao_periodo: ComissaoNoTrecho[]; conflitos: ConflitoCampanha[] } {
  return {
    comissao_periodo: [
      {
        marca: '10',
        cargo: '150',
        data_inicio: '2025-11-24',
        data_fim: '2025-11-24',
        pct_base: 1.0,
        pct_vigente: 2.5,
        pct_com_campanha: 3.0,
        historico: [
          {
            campanha_id: null,
            versao: null,
            tipo: 'ACRESCIMO',
            nome: 'Especificação nov/25, item 5g',
            data_inicio: '2025-11-24',
            data_fim: '2025-11-30',
            pct_acrescimo: 0.5,
            pct_novo: null,
            autor: null,
            aprovador: null,
            aprovada_em: null,
            justificativa: 'Gerentes: +0,5% nas vendas de 24 a 30/11 (Black Friday)',
          },
          {
            campanha_id: 9,
            versao: 1,
            tipo: 'ACRESCIMO',
            nome: 'Campanha A',
            data_inicio: '2025-11-20',
            data_fim: '2025-11-30',
            pct_acrescimo: 1.0,
            pct_novo: null,
            autor: 'Gabriela',
            aprovador: 'Sérgio',
            aprovada_em: '2026-10-15T14:02:00Z',
            justificativa: 'Reforço da última semana de novembro',
          },
        ],
      },
      {
        marca: '10',
        cargo: '150',
        data_inicio: '2025-11-25',
        data_fim: '2025-11-30',
        pct_base: 1.0,
        pct_vigente: 3.0,
        pct_com_campanha: 3.5,
        historico: [
          {
            campanha_id: null,
            versao: null,
            tipo: 'ACRESCIMO',
            nome: 'Especificação nov/25, item 5g',
            data_inicio: '2025-11-24',
            data_fim: '2025-11-30',
            pct_acrescimo: 0.5,
            pct_novo: null,
            autor: null,
            aprovador: null,
            aprovada_em: null,
            justificativa: 'Gerentes: +0,5% nas vendas de 24 a 30/11 (Black Friday)',
          },
          {
            campanha_id: 9,
            versao: 1,
            tipo: 'ACRESCIMO',
            nome: 'Campanha A',
            data_inicio: '2025-11-20',
            data_fim: '2025-11-30',
            pct_acrescimo: 1.0,
            pct_novo: null,
            autor: 'Gabriela',
            aprovador: 'Sérgio',
            aprovada_em: '2026-10-15T14:02:00Z',
            justificativa: 'Reforço da última semana de novembro',
          },
          {
            campanha_id: 10,
            versao: 1,
            tipo: 'ACRESCIMO',
            nome: 'Campanha B',
            data_inicio: '2025-11-25',
            data_fim: '2025-12-05',
            pct_acrescimo: 0.5,
            pct_novo: null,
            autor: 'Gabriela',
            aprovador: 'Sílvia',
            aprovada_em: '2026-10-16T10:30:00Z',
            justificativa: 'Gerentes puxam a virada para dezembro',
          },
        ],
      },
    ],
    conflitos: [
      {
        campanha_id: null,
        versao: null,
        tipo: 'ACRESCIMO',
        nome: 'Especificação nov/25, item 5g',
        status: 'APROVADA',
        autor: null,
        data_inicio: '2025-11-24',
        data_fim: '2025-11-30',
        sobreposicao: { data_inicio: '2025-11-24', data_fim: '2025-11-30' },
        marcas: ['10'],
        cargos: ['150'],
      },
      {
        campanha_id: 9,
        versao: 1,
        tipo: 'ACRESCIMO',
        nome: 'Campanha A',
        status: 'APROVADA',
        autor: 'Gabriela',
        data_inicio: '2025-11-20',
        data_fim: '2025-11-30',
        sobreposicao: { data_inicio: '2025-11-24', data_fim: '2025-11-30' },
        marcas: ['10'],
        cargos: ['150'],
      },
      {
        campanha_id: 10,
        versao: 1,
        tipo: 'ACRESCIMO',
        nome: 'Campanha B',
        status: 'APROVADA',
        autor: 'Gabriela',
        data_inicio: '2025-11-25',
        data_fim: '2025-12-05',
        sobreposicao: { data_inicio: '2025-11-25', data_fim: '2025-11-30' },
        marcas: ['10'],
        cargos: ['150'],
      },
    ],
  }
}

export function exemplo3Contrato(): { comissao_periodo: ComissaoNoTrecho[]; conflitos: ConflitoCampanha[] } {
  return {
    comissao_periodo: [
      {
        marca: '10',
        cargo: '100',
        data_inicio: '2025-09-01',
        data_fim: '2025-09-30',
        pct_base: 2.5,
        pct_vigente: 3.0,
        pct_com_campanha: 3.5,
        historico: [
          {
            campanha_id: null,
            versao: null,
            tipo: 'SUBSTITUICAO',
            nome: 'Especificação set/25, item 3g',
            data_inicio: '2025-09-01',
            data_fim: '2025-09-30',
            pct_acrescimo: null,
            pct_novo: 3.0,
            autor: null,
            aprovador: null,
            aprovada_em: null,
            justificativa: 'Somente em set/25, a marca 10 usa a % da marca 20 em todos os cargos',
          },
        ],
      },
    ],
    conflitos: [
      {
        campanha_id: null,
        versao: null,
        tipo: 'SUBSTITUICAO',
        nome: 'Especificação set/25, item 3g',
        status: 'APROVADA',
        autor: null,
        data_inicio: '2025-09-01',
        data_fim: '2025-09-30',
        sobreposicao: { data_inicio: '2025-09-01', data_fim: '2025-09-30' },
        marcas: ['10'],
        cargos: ['100'],
      },
    ],
  }
}
