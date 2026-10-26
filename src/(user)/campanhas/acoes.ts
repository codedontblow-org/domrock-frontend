import type { AcaoCampanha } from '../campanha/types'

export interface ConfigAcao {
  label: string
  variante: 'primario' | 'perigo' | 'secundario'
  icone: string
}

// Os botões que aparecem vêm de `acoes` (contrato 5.2); aqui fica só como cada um se apresenta.
const BOTOES: Record<AcaoCampanha, ConfigAcao> = {
  RENOMEAR: { label: 'Renomear', variante: 'secundario', icone: 'bi bi-input-cursor-text' },
  SUBMETER: { label: 'Submeter para aprovação', variante: 'primario', icone: 'bi bi-send' },
  EDITAR: { label: 'Editar', variante: 'primario', icone: 'bi bi-pencil' },
  ARQUIVAR: { label: 'Arquivar', variante: 'secundario', icone: 'bi bi-archive' },
}

/** Ex.: configAcao('EDITAR') -> { label: 'Editar', variante: 'primario', icone: 'bi bi-pencil' } */
export function configAcao(acao: AcaoCampanha): ConfigAcao {
  return BOTOES[acao]
}
