import { describe, expect, it } from 'vitest'
import { regraBlackFriday, resultadoBlackFriday } from '../../chat/__tests__/fakes'
import {
  cartaoDaFila, comVersao, descreverAlcance, diaMesDeData, duracaoEmDias, linhaAprovada, montarJustificativa,
  usoDoOrcamento,
} from '../montagem'
import type { CampanhaAprovada, FilaCampanha, VersaoCampanha } from '../types'

function itemDaFila(sobrescrever: Partial<FilaCampanha> = {}): FilaCampanha {
  return {
    id: 7, nome: 'Black Friday', versao: 1,
    autor: { id: 1, nome: 'Gabriela' },
    submetida_em: '2026-11-16T15:00:00Z',
    periodo: { data_inicio: '2025-11-24', data_fim: '2025-11-30' },
    custo_adicional: 1500, conflitos: 0, resimulacao_necessaria: false,
    ...sobrescrever,
  }
}

describe('montagem dos cards de aprovação', () => {
  it('formata datas sem hora e conta as duas pontas do período', () => {
    expect(diaMesDeData('2025-11-24')).toBe('24/11')
    expect(duracaoEmDias({ data_inicio: '2025-11-24', data_fim: '2025-11-30' })).toBe(7)
    expect(duracaoEmDias(null)).toBeNull()
  })

  it('monta o card da fila e espera a versão para o que depende da regra', () => {
    const cartao = cartaoDaFila(itemDaFila())
    expect(cartao).toMatchObject({
      titulo: 'Black Friday', inicio: '24/11', fim: '30/11', duracaoDias: 7,
      sugeridoPor: 'Gabriela', status: 'Sem conflitos', percentual: null, detalhe: 'carregando',
    })
    expect(cartao.custo).toContain('1.500,00')
  })

  it('mostra conflitos e resimulação no status', () => {
    expect(cartaoDaFila(itemDaFila({ conflitos: 2 })).status).toBe('2 conflitos')
    expect(cartaoDaFila(itemDaFila({ conflitos: 2, resimulacao_necessaria: true })).status).toBe('Resimulação necessária')
  })

  it('descreve o alcance com marcas, tratando "todas"', () => {
    expect(descreverAlcance(['100'], ['ALL'])).toBe('Afeta 1 cargo e todas as marcas.')
    expect(descreverAlcance(['100', '200'], ['10'])).toBe('Afeta 2 cargos e 1 marca.')
  })

  it('completa o card com a regra e o resultado da versão', () => {
    const versao = {
      campanha_id: 7, numero: 1, status: 'AGUARDANDO_APROVACAO', autor: { id: 1, nome: 'Gabriela' },
      submetida_em: '2026-11-16T15:00:00Z', simulacao_id: 3, resimulacao_necessaria: false, decisao: null,
      regra: regraBlackFriday(), resultado: resultadoBlackFriday(),
    } satisfies VersaoCampanha
    const cartao = comVersao(cartaoDaFila(itemDaFila()), versao)
    expect(cartao.detalhe).toBe('pronto')
    expect(cartao.percentual).toBe('+1%')
    expect(cartao.alcance).toBe('Afeta 3 cargos e todas as marcas.')
    expect(cartao.cargos).toEqual(['Vendedor loja', 'Vendedor balcão', 'Assistente de vendas'])
    expect(cartao.marcas).toEqual(['Todas'])
  })

  it('calcula o uso do orçamento e monta a justificativa com as interferências', () => {
    expect(usoDoOrcamento(1500, 20000)).toBe('7,5% do orçamento.')
    expect(usoDoOrcamento(1500, 0)).toBeNull()
    expect(montarJustificativa('  Reduzir o %  ', [])).toBe('Reduzir o %')
    expect(montarJustificativa('Reduzir', [{ tipo: 'Campanha', descricao: '+0,25% vigente' }]))
      .toBe('Reduzir\n\nInterferências citadas:\n- Campanha: +0,25% vigente')
  })
})

describe('linhaAprovada (Campanhas Passadas)', () => {
  const aprovada: CampanhaAprovada = {
    id: 1, nome: 'Natal', versao: 1, autor: { id: 1, nome: 'Gabriela' },
    periodo: { data_inicio: '2025-12-01', data_fim: '2025-12-24' }, vigencia: 'ENCERRADA',
    pct_acrescimo: 1.5, marcas: ['10', '20'], cargos: ['100', '150'], custo_adicional: 30674.22,
  }

  it('mostra datas completas, nomes de marca e cargo e o acréscimo', () => {
    expect(linhaAprovada(aprovada)).toEqual({
      id: 1, titulo: 'Natal', inicio: '01/12/2025', fim: '24/12/2025',
      cargo: 'Vendedor loja, Gerente', marca: 'Preto, Branco', percentual: '+1,5%',
    })
  })

  it('as seis marcas viram "Todas"', () => {
    const linha = linhaAprovada({ ...aprovada, marcas: ['10', '20', '30', '40', '50', '60'] })

    expect(linha.marca).toBe('Todas')
  })
})
