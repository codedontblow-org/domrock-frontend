import { describe, expect, it } from 'vitest'
import type { ConflitoCampanha } from '../../chat/types'
import { interferenciasDaVersao } from '../interferencias'
import type { IntercorrenciaVersao } from '../types'

describe('interferenciasDaVersao', () => {
  it('formata afastamento com cargo conhecido e período com início e fim', () => {
    const intercorrencia: IntercorrenciaVersao = {
      tipo: 'afastamento',
      matricula: 'MATRIC-58',
      cargo: '100',
      data_inicio: '2025-07-10',
      data_fim: '2025-07-24',
      origem: 'folha.xlsx',
    }

    const [resultado] = interferenciasDaVersao([intercorrencia], [])

    expect(resultado).toEqual({
      id: 'rh-MATRIC-58-afastamento-2025-07-10',
      tipo: 'Intercorrência',
      descricao: 'Afastamento de MATRIC-58 (Vendedor loja), 10/07 a 24/07',
    })
  })

  it('formata demissão com "em <data_inicio>"', () => {
    const intercorrencia: IntercorrenciaVersao = {
      tipo: 'demissao',
      matricula: 'MATRIC-62',
      cargo: '150',
      data_inicio: '2025-09-15',
      data_fim: null,
      origem: 'rescisao.xlsx',
    }

    const [resultado] = interferenciasDaVersao([intercorrencia], [])

    expect(resultado).toEqual({
      id: 'rh-MATRIC-62-demissao-2025-09-15',
      tipo: 'Intercorrência',
      descricao: 'Demissão de MATRIC-62 (Gerente), em 15/09',
    })
  })

  it('formata licença maternidade sem data de término com "desde <data_inicio>"', () => {
    const intercorrencia: IntercorrenciaVersao = {
      tipo: 'licenca_maternidade',
      matricula: 'MATRIC-71',
      cargo: '200',
      data_inicio: '2025-10-01',
      data_fim: null,
      origem: 'beneficios.xlsx',
    }

    const [resultado] = interferenciasDaVersao([intercorrencia], [])

    expect(resultado).toEqual({
      id: 'rh-MATRIC-71-licenca_maternidade-2025-10-01',
      tipo: 'Intercorrência',
      descricao: 'Licença maternidade de MATRIC-71 (Vendedor balcão), desde 01/10',
    })
  })

  it('formata férias sem cargo sem colocar parênteses', () => {
    const intercorrencia: IntercorrenciaVersao = {
      tipo: 'ferias',
      matricula: 'MATRIC-12',
      cargo: null,
      data_inicio: '2025-11-01',
      data_fim: '2025-11-15',
      origem: 'ferias.xlsx',
    }

    const [resultado] = interferenciasDaVersao([intercorrencia], [])

    expect(resultado).toEqual({
      id: 'rh-MATRIC-12-ferias-2025-11-01',
      tipo: 'Intercorrência',
      descricao: 'Férias de MATRIC-12, 01/11 a 15/11',
    })
  })

  it('formata conflito de campanha com nome, status legível e sobreposição', () => {
    const conflito: ConflitoCampanha = {
      campanha_id: 12,
      versao: 1,
      tipo: 'ACRESCIMO',
      nome: 'Semana do Vendedor',
      status: 'APROVADA',
      autor: 'Sérgio',
      data_inicio: '2025-11-20',
      data_fim: '2025-11-28',
      sobreposicao: { data_inicio: '2025-11-20', data_fim: '2025-11-28' },
      marcas: ['10'],
      cargos: ['100'],
    }

    const [resultado] = interferenciasDaVersao([], [conflito])

    expect(resultado).toEqual({
      id: 'campanha-12-1',
      tipo: 'Campanha',
      descricao: 'Semana do Vendedor (aprovada), 20/11 a 28/11',
    })
  })

  it('ordena os itens colocando eventos de RH primeiro e conflitos depois', () => {
    const intercorrencia: IntercorrenciaVersao = {
      tipo: 'afastamento',
      matricula: 'MATRIC-58',
      cargo: '100',
      data_inicio: '2025-07-10',
      data_fim: '2025-07-24',
      origem: 'folha.xlsx',
    }
    const conflito: ConflitoCampanha = {
      campanha_id: 9,
      versao: 2,
      tipo: 'ACRESCIMO',
      nome: 'Campanha de Inverno',
      status: 'AGUARDANDO_APROVACAO',
      autor: 'Gabriela',
      data_inicio: '2025-07-01',
      data_fim: '2025-07-15',
      sobreposicao: { data_inicio: '2025-07-10', data_fim: '2025-07-15' },
      marcas: ['10'],
      cargos: ['100'],
    }

    const resultado = interferenciasDaVersao([intercorrencia], [conflito])

    expect(resultado).toHaveLength(2)
    expect(resultado[0]?.tipo).toBe('Intercorrência')
    expect(resultado[1]?.tipo).toBe('Campanha')
  })
})
