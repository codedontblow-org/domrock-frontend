import { describe, expect, it } from 'vitest'
import { custoDaCampanha, diaDaCampanha, periodoDaCampanha, valorDoParametro } from '../formatacao'
import type { ParametroRegra, ValorParametro } from '../../chat/types'

function parametro(
  value: ValorParametro, options: ParametroRegra['options'] = null, type: ParametroRegra['type'] = 'multi_select',
): ParametroRegra {
  return { key: 'p', label: 'P', type, categoria: 'REGRA', value, options, required: true }
}

describe('formatação de Minhas campanhas', () => {
  it('data sem hora não volta um dia no fuso do Brasil', () => {
    expect(diaDaCampanha('2025-11-24')).toBe('24/11/2025')
  })

  it('período da campanha, ou "—" sem período', () => {
    expect(periodoDaCampanha({ data_inicio: '2025-11-24', data_fim: '2025-11-30' })).toBe('24/11/2025 – 30/11/2025')
    expect(periodoDaCampanha(null)).toBe('—')
  })

  it('custo em reais, ou "—" sem simulação', () => {
    expect(custoDaCampanha(23736.1).replace(/ /g, ' ')).toBe('R$ 23.736,10')
    expect(custoDaCampanha(null)).toBe('—')
  })

  it('parâmetro de lista mostra o rótulo das opções', () => {
    const marcas = parametro(['30', '99'], [{ id: '30', label: 'AZUL' }])

    expect(valorDoParametro(marcas)).toBe('AZUL, 99')
  })

  it('parâmetro de período mostra as datas; incompleto, "—"', () => {
    expect(valorDoParametro(parametro({ data_inicio: '2025-11-24', data_fim: '2025-11-30' })))
      .toBe('24/11/2025 – 30/11/2025')
    expect(valorDoParametro(parametro({ data_inicio: '2025-11-24', data_fim: null }))).toBe('—')
  })

  it('moeda e percentual seguem o `type` do parâmetro', () => {
    expect(valorDoParametro(parametro(2000000, null, 'currency')).replace(/ /g, ' ')).toBe('R$ 2.000.000,00')
    expect(valorDoParametro(parametro(1, null, 'percentage'))).toBe('1%')
  })

  it('parâmetro numérico e vazio', () => {
    expect(valorDoParametro(parametro(1.5))).toBe('1,5')
    expect(valorDoParametro(parametro(null))).toBe('—')
    expect(valorDoParametro(parametro([]))).toBe('—')
  })
})
