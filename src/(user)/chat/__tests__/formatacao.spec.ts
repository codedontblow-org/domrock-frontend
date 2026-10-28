import { describe, expect, it } from 'vitest'
import {
  dataLocal, formatarCelula, formatarData, formatarMilhares, formatarPercentual, formatarPercentualFixo,
  formatarTrecho, lerDecimal, lerReaisInteiros, saudacao,
} from '../formatacao'

describe('formatação dos campos da campanha', () => {
  it('lê reais inteiros ignorando pontos, prefixo e letras', () => {
    expect(lerReaisInteiros('R$ 2.000.000')).toBe(2000000)
    expect(lerReaisInteiros('')).toBeNull()
    expect(formatarMilhares(2000000)).toBe('2.000.000')
  })

  it('lê percentual com vírgula ou ponto', () => {
    expect(lerDecimal('0,84')).toBe(0.84)
    expect(lerDecimal('1.5')).toBe(1.5)
    expect(lerDecimal('1,5 %')).toBe(1.5)
    expect(lerDecimal('abc')).toBeNull()
  })
})

// A tela inicial dizia "Olá, Roberval!" para todo usuário, mesmo depois do login (A6-61).
describe('saudação da tela inicial', () => {
  it('usa o primeiro nome de quem entrou', () => {
    expect(saudacao('Gabriela')).toBe('Olá, Gabriela!')
    expect(saudacao('  Ana Lima ')).toBe('Olá, Ana!')
  })

  it('sem nome, cumprimenta sem inventar um', () => {
    expect(saudacao(undefined)).toBe('Olá!')
    expect(saudacao('')).toBe('Olá!')
  })
})

describe('células dos dados retornados pela consulta', () => {
  it('formata número em pt-BR, vazio como travessão e o resto como texto', () => {
    expect(formatarCelula(333666.01)).toBe('333.666,01')
    expect(formatarCelula(2025)).toBe('2025')
    expect(formatarCelula(null)).toBe('—')
    expect(formatarCelula('AZUL')).toBe('AZUL')
    expect(formatarCelula({ a: 1 })).toBe('{"a":1}')
  })
})

describe('formatação de data, trecho e percentual (A6-75)', () => {
  it('formata data ISO ou YYYY-MM-DD em dd/mm/aaaa', () => {
    expect(formatarData('2025-11-24')).toBe('24/11/2025')
    expect(formatarData('2026-10-15T14:02:00Z')).toBe('15/10/2026')
    expect(formatarData(null)).toBe('Não informado')
  })

  it('formata trechos de datas (um dia, mesmo mês, meses diferentes)', () => {
    expect(formatarTrecho('2025-11-24', '2025-11-24')).toBe('24/11')
    expect(formatarTrecho('2025-11-25', '2025-11-30')).toBe('25 a 30/11')
    expect(formatarTrecho('2025-11-25', '2025-12-05')).toBe('25/11 a 05/12')
  })

  it('data local formata Date no fuso local sem avançar o dia', () => {
    const data = new Date(2026, 9, 27, 23, 0)
    expect(dataLocal(data)).toBe('27/10/2026')
  })

  it('formatarPercentual e formatarPercentualFixo formatam percentuais (A6-75)', () => {
    expect(formatarPercentual(1)).toBe('1%')
    expect(formatarPercentual(0.49)).toBe('0,49%')
    expect(formatarPercentualFixo(1)).toBe('1,00%')
    expect(formatarPercentualFixo(0.5)).toBe('0,50%')
  })
})
