import type { CampanhaResumo, StatusCampanha } from './types'

export interface DescricaoStatus {
  label: string
  cor: string
  icone: string
}

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

export function useStatusCampanha() {
  function descreverStatus(status: StatusCampanha): DescricaoStatus {
    return DESCRICOES[status]
  }

  function etiquetaVigencia(campanha: CampanhaResumo): 'Vigente' | 'Encerrada' | null {
    if (campanha.status !== 'APROVADA') return null
    const fim = new Date(campanha.periodo_fim)
    return fim >= new Date() ? 'Vigente' : 'Encerrada'
  }

  return { descreverStatus, etiquetaVigencia }
}
