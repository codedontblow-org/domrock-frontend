import { describe, expect, it } from 'vitest'
import { configAcao } from '../acoes'
import type { AcaoCampanha } from '../../campanha/types'

describe('configAcao', () => {
  it.each([
    ['RENOMEAR', 'Renomear', 'secundario'],
    ['SUBMETER', 'Submeter para aprovação', 'primario'],
    ['EDITAR', 'Editar', 'primario'],
    ['ARQUIVAR', 'Arquivar', 'secundario'],
  ] as [AcaoCampanha, string, string][])('%s vira o botão "%s" (%s)', (acao, label, variante) => {
    expect(configAcao(acao)).toMatchObject({ label, variante })
    expect(configAcao(acao).icone).toMatch(/^bi bi-/)
  })
})
