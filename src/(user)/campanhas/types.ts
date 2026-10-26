export type StatusCampanha =
  | 'RASCUNHO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADA'
  | 'REPROVADA'
  | 'ARQUIVADA'

export interface VersaoCampanha {
  versao: number
  status: StatusCampanha
  criada_em: string
  decidida_em: string | null
  decisao: 'APROVADA' | 'REPROVADA' | null
  justificativa: string | null
}

export interface CampanhaResumo {
  id: number
  nome: string
  status: StatusCampanha
  versao_atual: number
  periodo_inicio: string
  periodo_fim: string
  custo_incremental: number | null
  atualizada_em: string
  autor_nome: string
}

export interface CampanhaDetalhe extends CampanhaResumo {
  autor_id: number
  rule_id: string
  chat_id: string
  parametros: import('../chat/types').ParametroRegra[]
  resultado_simulacao: import('../chat/types').ResultadoSimulacao | null
  versoes: VersaoCampanha[]
  mensagens: MensagemCampanha[]
}

export interface MensagemCampanha {
  id: number
  papel: 'usuario' | 'agente' | 'sistema'
  texto: string
  criada_em: string
}

export type AcaoCampanha =
  | 'simular'
  | 'submeter'
  | 'arquivar'
  | 'solicitar_cancelamento'
  | 'editar'
