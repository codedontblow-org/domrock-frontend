import { describe, expect, it } from 'vitest'
import { formatarMilhares, lerDecimal, lerReaisInteiros, saudacao } from '../formatacao'

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
