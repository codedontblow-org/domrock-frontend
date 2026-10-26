// Espelho do contrato de docs-camplana/informacoes_uteis/estrutura_parametros_regra.txt.

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
  filtros?: any                                                                                
  registros?: number | null                                                                    
  sql?: string | null                                                                          
  args?: Record<string, any> | null                                                            
  result?: any     
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
  cabe_no_orcamento: boolean
}

export interface ResultadoSimulacao {
  rule_id: string
  competencias: string[]
  totais: { baseline: number; simulado: number; diferenca: number; diferenca_pct: number }
  por_marca: QuebraDimensao[]
  por_cargo: QuebraDimensao[]
  orcamento: { orcamento_limite: number; custo_incremental: number; folga: number; cabe_no_orcamento: boolean }
  meta: { meta_vendas: number; vendas_periodo: number; pct_atingimento: number; atingida: boolean }
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
  status: string
}

/**
 * Onde a conversa está no caminho até a aprovação. `desatualizada`: o painel mudou depois da
 * última simulação, e o backend submete sempre a última simulação concluída. `fora_do_orcamento`:
 * o custo simulado passa do orçamento, e só campanha que cabe vai para aprovação.
 */
export type EtapaAprovacao =
  | 'sem_simulacao' | 'desatualizada' | 'fora_do_orcamento' | 'pronta' | 'enviando' | 'enviada' | 'somente_leitura'

export type PapelMensagem = 'usuario' | 'agente' | 'resultado' | 'erro'

export interface MensagemChat {
  id: number
  papel: PapelMensagem
  texto: string
  resultado?: ResultadoSimulacao
  events?: EventoAgente[]
}
