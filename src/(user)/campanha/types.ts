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

/** Itens de `acoes` da versão (contrato 5.6): o front mostra um botão por item e não deduz nada do perfil. */
export type AcaoVersao = 'APROVAR' | 'REPROVAR' | 'RESIMULAR'

/** Outra campanha do mesmo período aprovada depois da submissão (contrato 5.6). */
export interface AprovadaDepois {
  campanha_id: number
  nome: string
  aprovador: string
  aprovada_em: string
}

/** Última re-simulação concluída da versão (contrato 5.9): a decisão vale sobre este número. */
export interface ResimulacaoVersao {
  simulacao_id: number
  por: UsuarioResumo
  em: string
  resultado: ResultadoSimulacao
}

/** GET /api/campanhas/{id}/versoes/{numero}: a versão congelada na submissão. */
export interface VersaoCampanha {
  campanha_id: number
  numero: number
  status: StatusCampanha
  acoes: AcaoVersao[]
  autor: UsuarioResumo
  submetida_em: string
  simulacao_id: number
  regra: RegraCampanha
  resultado: ResultadoSimulacao
  resimulacao_necessaria: boolean
  aprovadas_depois: AprovadaDepois[]
  resimulacao: ResimulacaoVersao | null
  decisao: DecisaoCampanha | null
}

/** Itens de `acoes` da Campanha (contrato 5.2), na ordem dos botões: o front não deduz nada do status. */
export type AcaoCampanha = 'RENOMEAR' | 'SUBMETER' | 'EDITAR' | 'ARQUIVAR'

/** Item de `versoes` da Campanha (contrato 5.2): uma por submissão, da mais antiga para a mais nova. */
export interface VersaoResumo {
  numero: number
  status: StatusCampanha
  submetida_em: string
  decisao: DecisaoCampanha | null
}

/** A última simulação concluída: é ela que vira a próxima versão no submeter (contrato 5.2). */
export interface UltimaSimulacao {
  id: number
  regra: RegraCampanha
  resultado: ResultadoSimulacao
  concluida_em: string
}

/** GET /api/campanhas/{id} e as ações do autor (contrato 5.2 e 5.7): só o que a tela usa, sem o `log`. */
export interface CampanhaDetalhe {
  id: number
  nome: string
  status: StatusCampanha
  vigencia: CampanhaResumo['vigencia']
  em_simulacao: boolean
  acoes: AcaoCampanha[]
  autor: UsuarioResumo
  chat_id: string
  periodo: PeriodoCampanha | null
  versao_atual: number | null
  ultima_simulacao: UltimaSimulacao | null
  versoes: VersaoResumo[]
  criada_em: string
  atualizada_em: string
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
  submetida_em: string
  simulacao_id: number
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
  /** As `acoes` da versão; ausente enquanto ela carrega (nenhum botão aparece). */
  acoes?: AcaoVersao[]
  /** "Outra campanha deste período foi aprovada depois da submissão…", ou null. */
  avisoResimulacao?: string | null
  /** Custo adicional da última re-simulação, para comparar com `custo`. */
  custoResimulado?: string | null
}
