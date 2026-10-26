import { describe, expect, it } from 'vitest'
import {
  diferencaParaMeta, medidorDaMeta, medidorDoOrcamento, notaDoRetorno, numerosDaComissao, numerosDaMeta,
  numerosDoRetorno, seloDaMeta, seloDoOrcamento, textoDiferencaMeta, vereditoDoOrcamento,
} from '../resultado'
import { resultadoBlackFriday, resultadoDoCriterio } from './fakes'

// Intl.NumberFormat separa "R$" do número com espaço não separável (U+00A0).
const semNbsp = (texto: string) => texto.replace(/ /g, ' ')

describe('Bloco Meta', () => {
  it('acima da meta: selo verde, diferença em reais e a marca da meta dentro da barra', () => {
    const { meta } = resultadoDoCriterio('sem_orcamento')

    expect(seloDaMeta(meta)).toEqual({ texto: 'Acima da meta', tom: 'positivo' })
    expect(semNbsp(textoDiferencaMeta(meta))).toBe('R$ 406.125,93 acima da meta')
    const medidor = medidorDaMeta(meta)
    expect(medidor.tom).toBe('positivo')
    expect(medidor.marca).toBeCloseTo(100 / 126.33, 3)
    expect(medidor.proporcao).toBeCloseTo(120.31 / 126.33, 3)
  })

  it('abaixo da meta: selo laranja e a barra para antes da marca', () => {
    const { meta } = resultadoDoCriterio('meta_3_milhoes')

    expect(seloDaMeta(meta)).toEqual({ texto: 'Abaixo da meta', tom: 'aviso' })
    expect(semNbsp(textoDiferencaMeta(meta))).toBe('R$ 593.874,07 abaixo da meta')
    const medidor = medidorDaMeta(meta)
    expect(medidor.proporcao).toBeLessThan(medidor.marca ?? 0)
  })

  it('venda do período e meta como números de apoio', () => {
    const numeros = numerosDaMeta(resultadoDoCriterio('sem_orcamento').meta)

    expect(numeros.map((n) => [n.rotulo, semNbsp(n.valor)])).toEqual([
      ['Venda do período', 'R$ 2.406.125,93'],
      ['Meta', 'R$ 2.000.000,00'],
    ])
  })

  it('simulação anterior ao A6-72, sem `diferenca`, calcula a diferença pela venda e pela meta', () => {
    const meta = { meta_vendas: 2_000_000, vendas_periodo: 2406125.93, pct_atingimento: 120.31, atingida: true }

    expect(diferencaParaMeta(meta)).toBe(406125.93)
  })
})

describe('Bloco Comissão', () => {
  it('sem e com a campanha, o aumento na comissão e quem recebe o acréscimo', () => {
    const { totais, impacto } = resultadoBlackFriday()

    const numeros = numerosDaComissao(totais, impacto)

    expect(numeros.map((n) => n.rotulo)).toEqual(['Sem a campanha', 'Com a campanha', 'Recebem o acréscimo'])
    expect(numeros[1]).toMatchObject({ apoio: '+4,94% na comissão', tomApoio: 'destaque' })
    expect(semNbsp(numeros[2]?.valor ?? '')).toBe('312 de 548 pessoas')
    expect(semNbsp(numeros[2]?.apoio ?? '')).toBe('média de R$ 76,08 cada')
  })
})

describe('Bloco Retorno', () => {
  it('com a meta superada: custo sobre a venda e custo por R$ 1 acima da meta', () => {
    const { retorno } = resultadoDoCriterio('sem_orcamento')

    expect(numerosDoRetorno(retorno!).map((n) => [n.rotulo, semNbsp(n.valor)])).toEqual([
      ['Custo sobre a venda do período', '0,99%'],
      ['Custo por R$ 1 vendido acima da meta', 'R$ 0,06'],
    ])
    expect(notaDoRetorno(retorno!)).toBeNull()
  })

  it('abaixo da meta: só o custo sobre a venda, e uma nota dizendo por quê', () => {
    const { retorno } = resultadoDoCriterio('meta_3_milhoes')

    expect(numerosDoRetorno(retorno!).map((n) => n.rotulo)).toEqual(['Custo sobre a venda do período'])
    expect(notaDoRetorno(retorno!)).toBe('A venda não passou da meta, então não há custo por R$ 1 vendido acima dela.')
  })
})

describe('Bloco Orçamento', () => {
  it('estourou: selo vermelho, barra cheia e quanto passa', () => {
    const orcamento = resultadoDoCriterio('orcamento_20_mil').orcamento!

    expect(seloDoOrcamento(orcamento)).toEqual({ texto: 'Não cabe no orçamento', tom: 'negativo' })
    expect(medidorDoOrcamento(orcamento)).toEqual({ proporcao: 1, marca: null, tom: 'negativo' })
    expect(semNbsp(vereditoDoOrcamento(orcamento))).toBe('Passa R$ 3.736,10 do orçamento de R$ 20.000,00.')
  })

  it('coube: selo verde e quanto sobra', () => {
    const orcamento = resultadoBlackFriday().orcamento!

    expect(seloDoOrcamento(orcamento)).toEqual({ texto: 'Cabe no orçamento', tom: 'positivo' })
    expect(semNbsp(vereditoDoOrcamento(orcamento))).toContain('Sobram R$ 6.263,83')
  })
})
