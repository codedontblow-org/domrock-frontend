import { describe, expect, it } from 'vitest'
import { resumoDaFila, temRelatorio } from '../andamento'
import type { MesDaFila, SituacaoDoMes } from '../stores/importacao'

function mes(competencia: string | null, situacao: SituacaoDoMes, jobId: number | null = 1): MesDaFila {
  return { competencia, arquivos: [], situacao, jobId }
}

describe('resumo da fila de meses', () => {
  it('rodando com vários meses: qual mês está indo', () => {
    const fila = [mes('2025-07', 'CONCLUIDO'), mes('2025-08', 'PROCESSANDO'), mes('2025-09', 'NA_FILA', null)]

    expect(resumoDaFila(fila, true)).toBe('Mês 2 de 3 · ago/2025')
  })

  it('rodando com um mês só: o mês, ou "Lendo as planilhas" se o backend ainda não leu', () => {
    expect(resumoDaFila([mes('2025-10', 'PROCESSANDO')], true)).toBe('out/2025')
    expect(resumoDaFila([mes(null, 'PROCESSANDO')], true)).toBe('Lendo as planilhas')
  })

  it('terminada: quantos meses em cada situação, no singular e no plural', () => {
    const fila = [
      mes('2025-07', 'CONCLUIDO'), mes('2025-08', 'CONCLUIDO'), mes('2025-09', 'PENDENTE'),
      mes('2025-10', 'NAO_ENVIADO', null),
    ]

    expect(resumoDaFila(fila, false)).toBe('2 concluídos · 1 pendente · 1 não enviado')
  })

  it('só mês que terminou no backend tem relatório', () => {
    expect(temRelatorio(mes('2025-07', 'PENDENTE'))).toBe(true)
    expect(temRelatorio(mes('2025-07', 'FALHA'))).toBe(true)
    expect(temRelatorio(mes('2025-07', 'PROCESSANDO'))).toBe(false)
    expect(temRelatorio(mes('2025-07', 'NAO_ENVIADO', null))).toBe(false)
  })
})
