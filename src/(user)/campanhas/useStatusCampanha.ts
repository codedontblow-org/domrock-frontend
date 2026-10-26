import type { CampanhaResumo, StatusCampanha } from '../campanha/types'

export interface DescricaoStatus {
  label: string
  cor: string
  icone: string
}

export type EtiquetaVigencia = 'Vigente' | 'Encerrada'

const DESCRICOES: Record<StatusCampanha, DescricaoStatus> = {
  RASCUNHO: {
    label: 'Rascunho',
    cor: 'status--rascunho',
    icone: 'bi bi-pencil-square',
  },
  AGUARDANDO_APROVACAO: {
    label: 'Aguardando aprovação',
    cor: 'status--aguardando',
    icone: 'bi bi-hourglass-split',
  },
  APROVADA: {
    label: 'Aprovada',
    cor: 'status--aprovada',
    icone: 'bi bi-check-circle-fill',
  },
  REPROVADA: {
    label: 'Reprovada',
    cor: 'status--reprovada',
    icone: 'bi bi-x-circle-fill',
  },
  ARQUIVADA: {
    label: 'Arquivada',
    cor: 'status--arquivada',
    icone: 'bi bi-archive-fill',
  },
}

// A vigência vem do backend (contrato 5.2); a campanha FUTURA ainda não ganha etiqueta (card A6-67).
const ETIQUETAS_DE_VIGENCIA: Record<NonNullable<CampanhaResumo['vigencia']>, EtiquetaVigencia | null> = {
  FUTURA: null,
  VIGENTE: 'Vigente',
  ENCERRADA: 'Encerrada',
}

export function useStatusCampanha() {
  function descreverStatus(status: StatusCampanha): DescricaoStatus {
    return DESCRICOES[status]
  }

  /** Ex.: etiquetaVigencia({ status: 'APROVADA', vigencia: 'VIGENTE' }) -> 'Vigente' */
  function etiquetaVigencia(campanha: Pick<CampanhaResumo, 'status' | 'vigencia'>): EtiquetaVigencia | null {
    if (campanha.status !== 'APROVADA' || campanha.vigencia === null) return null
    return ETIQUETAS_DE_VIGENCIA[campanha.vigencia]
  }

  return { descreverStatus, etiquetaVigencia }
}
