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

/** Passo registrado na trilha de auditoria montada pelo código (contrato 2.2). */
export interface PassoTrilha {
  ordem: number
  ferramenta: string
  descricao: string
  tabelas_acessadas: string[]
  competencias: string[]
  filtros: string | null
  sql_executado: string | null
  registros_retornados: number | null
  dados: Record<string, unknown>[] | null
  tempo_ms: number
  situacao: string
  mensagem_erro: string | null
}

/** Trilha de auditoria que acompanha a resposta da Lana e a simulação (contrato 2.2). */
export interface TrilhaChat {
  modelo: string
  tentativas: number | null
  premissas: string[]
  passos: PassoTrilha[]
}

/** Papéis de mensagem gravados no banco de dados (contrato 3.2). */
export type PapelMensagemBackend = 'usuario' | 'lana' | 'sistema'

/** Mensagem de sistema da conversa: simulação concluída ou transição de status (contrato 3.2). */
export type TipoMensagemSistema = 'SIMULACAO' | 'STATUS'

/** Item do histórico devolvido por GET /api/chat/{chat_id}/mensagens (contrato 3.2). */
export interface MensagemGravada {
  id: number
  papel: PapelMensagemBackend
  texto: string
  criada_em: string
  regra?: RegraCampanha | null
  trilha?: TrilhaChat | null
  tipo?: TipoMensagemSistema
  simulacao_id?: number | null
}

/** Conversa gravada com suas mensagens em ordem (contrato 3.2). */
export interface ConversaGravada {
  chat_id: string
  campanha_id: number | null
  mensagens: MensagemGravada[]
}

export interface RespostaChat {
  chat_id: string
  response: string
  regra: RegraCampanha | null
  events?: EventoAgente[]
  trilha?: TrilhaChat | null
  mensagens_sistema?: MensagemGravada[]
  solicitacao?: unknown | null
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
  comissao_periodo?: ComissaoNoTrecho[]
  conflitos?: ConflitoCampanha[]
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
  trilha?: TrilhaChat | null
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
  id: number | string
  chave: string
  papel: PapelMensagem
  texto: string
  tipo?: TipoMensagemSistema
  simulacao_id?: number | null
  criada_em?: string
  resultado?: ResultadoSimulacao
  events?: EventoAgente[]
}

// Contrato 2.3 (A6-74 e A6-75): histórico de campanhas e sobreposição no período simulado.
export type TipoCampanhaHistorico = 'ACRESCIMO' | 'SUBSTITUICAO'
export type StatusConflito = 'APROVADA' | 'AGUARDANDO_APROVACAO'

export interface HistoricoComissaoTrecho {
  campanha_id: number | null
  versao: number | null
  tipo: TipoCampanhaHistorico
  nome: string
  data_inicio: string
  data_fim: string
  pct_acrescimo: number | null
  pct_novo: number | null
  autor: string | null
  aprovador: string | null
  aprovada_em: string | null
  justificativa: string
}

export interface ComissaoNoTrecho {
  marca: string
  cargo: string
  data_inicio: string
  data_fim: string
  pct_base: number
  pct_vigente: number
  pct_com_campanha: number
  historico: HistoricoComissaoTrecho[]
}

export interface SobreposicaoDatas {
  data_inicio: string
  data_fim: string
}

export interface ConflitoCampanha {
  campanha_id: number | null
  versao: number | null
  tipo: TipoCampanhaHistorico
  nome: string
  status: StatusConflito
  autor: string | null
  data_inicio: string
  data_fim: string
  sobreposicao: SobreposicaoDatas
  marcas: string[]
  cargos: string[]
}
