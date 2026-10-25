import type { RegraCampanha, ResultadoSimulacao } from '../chat/types'

export type StatusCampanha = 'RASCUNHO' | 'AGUARDANDO_APROVACAO' | 'APROVADA' | 'REPROVADA' | 'ARQUIVADA'

export type Decisao = 'APROVADA' | 'REPROVADA'

export interface UsuarioResumo {
  id: number | null
  nome: string | null
}

export interface PeriodoCampanha {
  data_inicio: string
  data_fim: string
}

export interface FilaCampanha {
  id: number
  nome: string
  versao: number
  autor: UsuarioResumo
  submetida_em: string
  periodo: PeriodoCampanha | null
  custo_adicional: number | null
  conflitos: number
  resimulacao_necessaria: boolean
}

/** Item de GET /api/campanhas/ */
export interface CampanhaResumo {
  id: number
  nome: string
  status: StatusCampanha
  vigencia: 'FUTURA' | 'VIGENTE' | 'ENCERRADA' | null
  em_simulacao: boolean
  versao_atual: number | null
  periodo: PeriodoCampanha | null
  custo_adicional: number | null
  atualizada_em: string
}

export interface DecisaoCampanha {
  decisao: Decisao
  por: UsuarioResumo
  em: string
  justificativa: string | null
}

/** GET /api/campanhas/{id}/versoes/{numero}: a versão congelada na submissão. */
export interface VersaoCampanha {
  campanha_id: number
  numero: number
  status: StatusCampanha
  autor: UsuarioResumo
  submetida_em: string
  simulacao_id: number
  regra: RegraCampanha
  resultado: ResultadoSimulacao
  resimulacao_necessaria: boolean
  decisao: DecisaoCampanha | null
}

/** GET /api/campanhas/{id}: só o que a tela usa. */
export interface CampanhaDetalhe {
  id: number
  nome: string
  status: StatusCampanha
  chat_id: string
  versao_atual: number | null
}

// A rota entra no A6-68: corpo suposto a partir dos testes do backend (decisão + justificativa).
/** Item de GET /api/campanhas/aprovadas: a versão aprovada; `marcas` já sem "ALL". */
export interface CampanhaAprovada {
  id: number
  nome: string
  versao: number
  autor: UsuarioResumo
  periodo: PeriodoCampanha
  vigencia: 'FUTURA' | 'VIGENTE' | 'ENCERRADA' | null
  pct_acrescimo: number | null
  marcas: string[]
  cargos: string[]
  custo_adicional: number
}

/** Corpo de POST /api/campanhas/{id}/decidir (contrato 5.8): `versao` é a que o Supervisor viu. */
export interface PedidoDecisao {
  versao: number
  decisao: 'APROVAR' | 'REPROVAR'
  justificativa: string | null
}


export interface ItemDetalhe {
  rotulo: string
  valor: string
  destaque?: boolean
}

export interface Interferencia {
  id: number | string
  tipo: 'Intercorrência' | 'Campanha'
  descricao: string
}

/**
 * Um card de "Aguardando Aprovação". Nasce da fila (ou de "minhas") e é completado com a
 * versão congelada: até lá, `detalhe` é 'carregando' e os campos que dependem da regra são null.
 */
export interface CampanhaAprovacao {
  id: number
  versao: number | null
  titulo: string
  inicio: string
  fim: string
  duracaoDias: number | null
  sugeridoPor: string
  submetidoEm: string
  status: string
  custo: string
  custoDetalhe: string | null
  percentual: string | null
  alcance: string | null
  detalhe: 'carregando' | 'pronto' | 'indisponivel'
  descricao?: string
  simulacaoId?: number
  acrescimos?: ItemDetalhe[]
  impacto?: ItemDetalhe[]
  marcas?: string[]
  cargos?: string[]
  interferencias?: Interferencia[]
}
