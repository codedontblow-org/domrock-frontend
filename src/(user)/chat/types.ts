// Espelho do contrato de docs-camplana/informacoes_uteis/estrutura_parametros_regra.txt.

import type { StatusCampanha } from '../campanha/types'

export type TipoParametro = 'date_range' | 'percentage' | 'multi_select' | 'currency'

export interface OpcaoParametro {
  id: string
  label: string
}

export interface Periodo {
  data_inicio: string | null
  data_fim: string | null
}

export type ValorParametro = Periodo | number | string[] | null

export interface ParametroRegra {
  key: string
  label: string
  type: TipoParametro
  categoria: 'REGRA' | 'CONSTRAINT'
  value: ValorParametro
  options: OpcaoParametro[] | null
  required: boolean
}

export interface RegraCampanha {
  rule_id: string
  tipo_regra: string
  raw_prompt: string
  status: string
  parametros: ParametroRegra[]
  faltantes: string[]
}

export interface EventoAgente {
  ferramenta: string
  descricao_legivel: string
  tempo: number
  situacao: string
  tabelas?: string[] | null
  competencias?: string[] | null
  filtros?: unknown
  registros?: number | null
  sql?: string | null
  args?: Record<string, unknown> | null
  result?: unknown
}

export interface RespostaChat {
  chat_id: string
  response: string
  regra: RegraCampanha | null
  events?: EventoAgente[]
}

export interface QuebraDimensao {
  codigo: string
  baseline: number
  simulado: number
  diferenca: number
}

export interface ImpactoPessoas {
  pessoas_impactadas: number
  pessoas_total: number
  media_por_pessoa: number
  maior_acrescimo: number
}

export interface CenarioAlternativo {
  tipo: 'ajustar_acrescimo' | 'sem_marca'
  titulo: string
  pct_acrescimo: number
  marcas_alvo: string[]
  custo_incremental: number
  economia: number
  /** null quando a ficha não tem orçamento (A6-72). */
  cabe_no_orcamento: boolean | null
}

export interface TotaisSimulacao {
  baseline: number
  simulado: number
  diferenca: number
  diferenca_pct: number
}

export interface VereditoOrcamento {
  orcamento_limite: number
  custo_incremental: number
  folga: number
  cabe_no_orcamento: boolean
}

export interface AtingimentoMeta {
  meta_vendas: number
  vendas_periodo: number
  pct_atingimento: number
  atingida: boolean
  /** Venda do período − meta (A6-72). Ausente nas simulações anteriores a ele. */
  diferenca?: number
}

export interface ResultadoSimulacao {
  rule_id: string
  competencias: string[]
  totais: TotaisSimulacao
  por_marca: QuebraDimensao[]
  por_cargo: QuebraDimensao[]
  /** null quando a ficha não tem orçamento (A6-72: orçamento é opcional). */
  orcamento: VereditoOrcamento | null
  meta: AtingimentoMeta
  // A Lana também manda `retorno` (contrato 2.3); a tela só o usa na Sprint 3 (decisão do PO, 26/10).
  impacto: ImpactoPessoas
  maiores_lojas: QuebraDimensao[]
  cenarios: CenarioAlternativo[]
  ressalvas: string[]
  codigo: string
  origem_codigo: string
  tentativas: number
  explicacao: string
  observacao?: string
}

export interface FalhaSimulacao {
  etapa: string
  mensagem: string
  erros?: string[]
}

/** Status do job de simulação (contrato 4). */
export type StatusSimulacao = 'PENDENTE' | 'RODANDO' | 'CONCLUIDA' | 'ERRO'

/** Resposta 202 do POST /api/simulacoes: o job criado (contrato 4.1). */
export interface SimulacaoCriada {
  id: number
  status: StatusSimulacao
  etapa: string
}

interface CamposDoJob {
  id: number
  /** Texto pronto para o usuário ("Na fila", "Simulando", ...). */
  etapa: string
  chat_id: string
  campanha_id: number | null
  criada_em: string
  concluida_em: string | null
  duracao_ms: number | null
  ficha: RegraCampanha
}

/** GET /api/simulacoes/{id} (contrato 4.2): `resultado` só na conclusão, `erro` só no ERRO. */
export type SimulacaoAndamento =
  | (CamposDoJob & { status: 'PENDENTE' | 'RODANDO'; resultado: null; erro: null })
  | (CamposDoJob & { status: 'CONCLUIDA'; resultado: ResultadoSimulacao; erro: null })
  | (CamposDoJob & { status: 'ERRO'; resultado: null; erro: FalhaSimulacao })

/** Simulação que terminou: o `id` é o que o salvar da campanha pede (contrato 5.3). */
export interface SimulacaoConcluida {
  id: number
  resultado: ResultadoSimulacao
}

/** O que o chat usa do objeto Campanha (contrato 5.2) devolvido pelo salvar e pelo submeter. */
export interface CampanhaSalva {
  id: number
  nome: string
  status: StatusCampanha
  versao_atual: number | null
}

/**
 * Onde a conversa está no caminho até a aprovação. `desatualizada`: o painel mudou depois da
 * última simulação, e o backend submete sempre a última simulação concluída. `fora_do_orcamento`:
 * o custo simulado passa do orçamento; vai para aprovação mesmo assim, com aviso (decisão do PO, 26/10).
 */
export type EtapaAprovacao =
  | 'sem_simulacao' | 'desatualizada' | 'fora_do_orcamento' | 'pronta' | 'enviando' | 'enviada' | 'somente_leitura'

/** Etapas em que o botão "Enviar para aprovação" funciona. */
export const ETAPAS_DE_ENVIO: readonly EtapaAprovacao[] = ['pronta', 'fora_do_orcamento']

export type PapelMensagem = 'usuario' | 'agente' | 'resultado' | 'erro' | 'sistema'

export interface MensagemChat {
  id: number
  papel: PapelMensagem
  texto: string
  resultado?: ResultadoSimulacao
  events?: EventoAgente[]
}
