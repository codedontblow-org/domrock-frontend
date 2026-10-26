import { describe, expect, it } from 'vitest'
import { formatarCompetencia, formatarDataHora, formatarHora, formatarTamanho, linhasGravadas } from '../formatacao'

const SAO_PAULO = 'America/Sao_Paulo'

describe('formatação da importação', () => {
  it.each([
    ['2025-10', 'out/2025'],
    ['2026-01', 'jan/2026'],
    [null, '—'],
  ])('competência %s -> %s', (competencia, texto) => {
    expect(formatarCompetencia(competencia)).toBe(texto)
  })

  it('data e hora do backend (UTC) aparecem no fuso de quem usa', () => {
    expect(formatarDataHora('2026-10-20T04:37:00Z', SAO_PAULO)).toBe('20/10/2026 01:37')
    expect(formatarHora('2026-10-20T04:39:10Z', SAO_PAULO)).toBe('01:39')
  })

  it.each([
    [62_464, '61 KB'],
    [151_552, '148 KB'],
    [300, '1 KB'],
    [1_258_291, '1,2 MB'],
  ])('tamanho %d bytes -> %s', (bytes, texto) => {
    expect(formatarTamanho(bytes)).toBe(texto)
  })

  it('linhas gravadas de quantas foram lidas; enquanto processa, traço', () => {
    expect(linhasGravadas({ status: 'CONCLUIDO', linhas_importadas: 5462, total_linhas: 5468 })).toBe('5.462 de 5.468')
    expect(linhasGravadas({ status: 'PENDENTE', linhas_importadas: 0, total_linhas: 5498 })).toBe('0 de 5.498')
    expect(linhasGravadas({ status: 'PROCESSANDO', linhas_importadas: 0, total_linhas: 0 })).toBe('—')
  })
})
