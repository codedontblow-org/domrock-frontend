import { describe, expect, it } from 'vitest'
import { acoesDisponiveis, configAcao } from '../acoes'
import type { StatusCampanha } from '../types'

describe('acoesDisponiveis', () => {
  it('RASCUNHO → simular, submeter, arquivar', () => {
    expect(acoesDisponiveis('RASCUNHO')).toEqual(['simular', 'submeter', 'arquivar'])
  })

  it('AGUARDANDO_APROVACAO → nenhuma ação', () => {
    expect(acoesDisponiveis('AGUARDANDO_APROVACAO')).toEqual([])
  })

  it('APROVADA → solicitar_cancelamento', () => {
    expect(acoesDisponiveis('APROVADA')).toEqual(['solicitar_cancelamento'])
  })

  it('REPROVADA → editar, arquivar', () => {
    expect(acoesDisponiveis('REPROVADA')).toEqual(['editar', 'arquivar'])
  })

  it('ARQUIVADA → nenhuma ação', () => {
    expect(acoesDisponiveis('ARQUIVADA')).toEqual([])
  })
})

describe('configAcao', () => {
  it('submeter tem variante primário', () => {
    expect(configAcao('submeter').variante).toBe('primario')
  })

  it('arquivar tem variante secundário', () => {
    expect(configAcao('arquivar').variante).toBe('secundario')
  })

  it('solicitar_cancelamento tem variante perigo', () => {
    expect(configAcao('solicitar_cancelamento').variante).toBe('perigo')
  })

  it('todas as ações têm label e ícone', () => {
    const acoes = ['simular', 'submeter', 'arquivar', 'solicitar_cancelamento', 'editar'] as const
    for (const acao of acoes) {
      const cfg = configAcao(acao)
      expect(cfg.label).toBeTruthy()
      expect(cfg.icone).toBeTruthy()
    }
  })
})
