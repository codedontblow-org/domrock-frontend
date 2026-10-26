import type { AcaoCampanha, StatusCampanha } from './types'

export function acoesDisponiveis(status: StatusCampanha): AcaoCampanha[] {
  switch (status) {
    case 'RASCUNHO':
      return ['simular', 'submeter', 'arquivar']
    case 'AGUARDANDO_APROVACAO':
      return []
    case 'APROVADA':
      return ['solicitar_cancelamento']
    case 'REPROVADA':
      return ['editar', 'arquivar']
    case 'ARQUIVADA':
      return []
  }
}

export interface ConfigAcao {
  label: string
  variante: 'primario' | 'perigo' | 'secundario'
  icone: string
}

export function configAcao(acao: AcaoCampanha): ConfigAcao {
  switch (acao) {
    case 'simular':
      return { label: 'Simular', variante: 'secundario', icone: 'bi bi-play-circle' }
    case 'submeter':
      return { label: 'Submeter para aprovação', variante: 'primario', icone: 'bi bi-send' }
    case 'arquivar':
      return { label: 'Arquivar', variante: 'secundario', icone: 'bi bi-archive' }
    case 'solicitar_cancelamento':
      return { label: 'Solicitar cancelamento', variante: 'perigo', icone: 'bi bi-x-circle' }
    case 'editar':
      return { label: 'Editar', variante: 'primario', icone: 'bi bi-pencil' }
  }
}
