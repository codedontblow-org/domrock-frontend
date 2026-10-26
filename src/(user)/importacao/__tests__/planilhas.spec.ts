import { describe, expect, it } from 'vitest'
import { competenciaDoNome, separarPorMes, tipoDaPlanilha } from '../planilhas'

/** Só o nome importa para separar; o conteúdo quem lê é o backend. */
function planilhas(...nomes: string[]): Array<{ name: string }> {
  return nomes.map((name) => ({ name }))
}

function nomesPorMes(arquivos: Array<{ name: string }>): Record<string, string[]> {
  const { lotes } = separarPorMes(arquivos)
  return Object.fromEntries(lotes.map((l) => [l.competencia, l.arquivos.map((a) => a.name)]))
}

describe('tipoDaPlanilha (mesma regra do DetectorTipoArquivo do backend)', () => {
  it.each([
    ['BASE RH_OUT25.xlsx', 'RH'],
    ['BASE_VENDAS_OUT25.xlsx', 'VENDAS'],
    ['BASE_COMMISS_FINAL.xlsx', 'COMISSAO'],
    ['base_comissao_out25.xlsx', 'COMISSAO'],
    ['planilha.xlsx', null],
  ])('%s -> %s', (nome, tipo) => {
    expect(tipoDaPlanilha(nome)).toBe(tipo)
  })
})

describe('competenciaDoNome (mesma regra do CompetenciaExtractor do backend)', () => {
  it.each([
    ['BASE RH_OUT25.xlsx', '2025-10'],
    ['BASE_VENDAS_jan26.xlsx', '2026-01'],
    ['BASE_COMMISS_FINAL.xlsx', null],
  ])('%s -> %s', (nome, competencia) => {
    expect(competenciaDoNome(nome)).toBe(competencia)
  })
})

describe('separarPorMes', () => {
  it('separa as 13 planilhas do dataset em 6 meses, em ordem, com a Comissão no primeiro', () => {
    const dataset = planilhas(
      'BASE_VENDAS_OUT25.xlsx', 'BASE_VENDAS_SET25.xlsx', 'BASE_COMMISS_FINAL.xlsx', 'BASE RH_SET25.xlsx',
      'BASE_VENDAS_NOV25.xlsx', 'BASE_VENDAS_DEZ25.xlsx', 'BASE RH_AGO25.xlsx', 'BASE RH_OUT25.xlsx',
      'BASE RH_JUL25.xlsx', 'BASE RH_NOV25.xlsx', 'BASE RH_DEZ25.xlsx', 'BASE_VENDAS_JUL25.xlsx',
      'BASE_VENDAS_AGO25.xlsx',
    )

    expect(separarPorMes(dataset).problemas).toEqual([])
    expect(nomesPorMes(dataset)).toEqual({
      '2025-07': ['BASE RH_JUL25.xlsx', 'BASE_VENDAS_JUL25.xlsx', 'BASE_COMMISS_FINAL.xlsx'],
      '2025-08': ['BASE RH_AGO25.xlsx', 'BASE_VENDAS_AGO25.xlsx'],
      '2025-09': ['BASE RH_SET25.xlsx', 'BASE_VENDAS_SET25.xlsx'],
      '2025-10': ['BASE RH_OUT25.xlsx', 'BASE_VENDAS_OUT25.xlsx'],
      '2025-11': ['BASE RH_NOV25.xlsx', 'BASE_VENDAS_NOV25.xlsx'],
      '2025-12': ['BASE RH_DEZ25.xlsx', 'BASE_VENDAS_DEZ25.xlsx'],
    })
    expect(Object.keys(nomesPorMes(dataset))).toEqual(['2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'])
  })

  it('Comissão com mês no nome vai com aquele mês', () => {
    const arquivos = planilhas(
      'BASE RH_JUL25.xlsx', 'BASE_VENDAS_JUL25.xlsx', 'BASE RH_AGO25.xlsx', 'BASE_VENDAS_AGO25.xlsx',
      'BASE_COMMISS_AGO25.xlsx',
    )

    expect(nomesPorMes(arquivos)['2025-08']).toEqual(['BASE RH_AGO25.xlsx', 'BASE_VENDAS_AGO25.xlsx', 'BASE_COMMISS_AGO25.xlsx'])
  })

  it.each([
    [['BASE RH_OUT25.xlsx'], 'out/2025: falta a planilha de Vendas'],
    [['BASE_VENDAS_OUT25.xlsx'], 'out/2025: falta a planilha de RH'],
    [['BASE RH_OUT25.xlsx', 'BASE_VENDAS_OUT25.xlsx', 'BASE RH_OUT25 (1).xlsx'], 'out/2025: mais de uma planilha de RH'],
    [['BASE RH_OUT25.csv'], 'BASE RH_OUT25.csv: só planilhas .xlsx'],
    [['planilha.xlsx'], 'planilha.xlsx: o nome não diz se é RH, Vendas ou Comissão'],
    [['BASE RH.xlsx'], 'BASE RH.xlsx: o nome não diz o mês (ex.: BASE RH_OUT25.xlsx)'],
    [['BASE_COMMISS_FINAL.xlsx'], 'A Comissão vai junto com o RH e as Vendas de um mês'],
    [
      ['BASE RH_OUT25.xlsx', 'BASE_VENDAS_OUT25.xlsx', 'BASE_COMMISS_FINAL.xlsx', 'BASE_COMISSAO_NOVA.xlsx'],
      'Mais de uma planilha de Comissão sem mês no nome',
    ],
  ])('%j aponta "%s"', (nomes, problema) => {
    expect(separarPorMes(planilhas(...nomes)).problemas).toContain(problema)
  })

  it('não monta lote nenhum enquanto houver problema, para nada ser enviado pela metade', () => {
    const arquivos = planilhas('BASE RH_JUL25.xlsx', 'BASE_VENDAS_JUL25.xlsx', 'BASE RH_AGO25.xlsx')

    expect(separarPorMes(arquivos).lotes).toEqual([])
  })
})
