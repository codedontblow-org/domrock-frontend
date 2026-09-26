// Espelho do contrato de docs-camplana/informacoes_uteis/estrutura_parametros_regra.txt.

export type TipoParametro = 'date_range' | 'percentage' | 'multi_select' | 'currency'

export interface OpcaoParametro {
  id: string
  label: string
}

// Uma das pontas pode vir null quando o usuário só disse "a partir de 24/11".
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

export interface RespostaChat {
  chat_id: string
  response: string
  regra: RegraCampanha | null
}

export interface QuebraDimensao {
  codigo: string
  baseline: number
  simulado: number
  diferenca: number
}

export interface ResultadoSimulacao {
  rule_id: string
  competencias: string[]
  totais: { baseline: number; simulado: number; diferenca: number; diferenca_pct: number }
  por_marca: QuebraDimensao[]
  por_cargo: QuebraDimensao[]
  orcamento: { orcamento_limite: number; custo_incremental: number; folga: number; cabe_no_orcamento: boolean }
  meta: { meta_vendas: number; vendas_periodo: number; pct_atingimento: number; atingida: boolean }
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

export type PapelMensagem = 'usuario' | 'agente' | 'resultado' | 'erro'

export interface MensagemChat {
  id: number
  papel: PapelMensagem
  texto: string
  resultado?: ResultadoSimulacao
}
