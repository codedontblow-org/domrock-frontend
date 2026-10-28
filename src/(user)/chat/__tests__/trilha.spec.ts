import { describe, expect, it } from 'vitest'
import { eventosDaTrilha } from '../trilha'
import type { TrilhaChat } from '../types'

describe('eventosDaTrilha (contrato 2.2 -> FerramentasDropdown)', () => {
  it('devolve lista vazia quando a trilha for nula ou indefinida', () => {
    expect(eventosDaTrilha(null)).toEqual([])
    expect(eventosDaTrilha(undefined)).toEqual([])
  })

  it('devolve lista vazia quando não houver passos', () => {
    const trilhaVazia: TrilhaChat = {
      modelo: 'gemini-3.5-flash-lite',
      tentativas: null,
      premissas: [],
      passos: [],
    }
    expect(eventosDaTrilha(trilhaVazia)).toEqual([])
  })

  it('converte passo com sucesso mapeando todos os campos para EventoAgente', () => {
    const trilha: TrilhaChat = {
      modelo: 'gemini-3.5-flash-lite',
      tentativas: null,
      premissas: ['Todas as marcas'],
      passos: [
        {
          ordem: 1,
          ferramenta: 'consultar_banco',
          descricao: 'Venda da marca 30 em out/2025',
          tabelas_acessadas: ['venda', 'loja', 'marca'],
          competencias: ['2025-10'],
          filtros: 'marca 30; vendas de 01/10/2025 a 31/10/2025',
          sql_executado: 'SELECT total FROM venda LIMIT 50',
          registros_retornados: 1,
          dados: [{ qtd_vendas: 188, total: 333666.01 }],
          tempo_ms: 340,
          situacao: 'SUCESSO',
          mensagem_erro: null,
        },
      ],
    }

    const [evento] = eventosDaTrilha(trilha)
    expect(evento).toBeDefined()
    expect(evento?.ferramenta).toBe('consultar_banco')
    expect(evento?.descricao_legivel).toBe('Venda da marca 30 em out/2025')
    expect(evento?.tempo).toBe(340)
    expect(evento?.situacao).toBe('SUCESSO')
    expect(evento?.tabelas).toEqual(['venda', 'loja', 'marca'])
    expect(evento?.competencias).toEqual(['2025-10'])
    expect(evento?.filtros).toBe('marca 30; vendas de 01/10/2025 a 31/10/2025')
    expect(evento?.registros).toBe(1)
    expect(evento?.sql).toBe('SELECT total FROM venda LIMIT 50')
    expect(evento?.result).toEqual({ dados: [{ qtd_vendas: 188, total: 333666.01 }] })
  })

  it('converte passo com erro incluindo a mensagem na situacao para exibição', () => {
    const trilhaComErro: TrilhaChat = {
      modelo: 'gemini-3.5-flash-lite',
      tentativas: 1,
      premissas: [],
      passos: [
        {
          ordem: 1,
          ferramenta: 'consultar_banco',
          descricao: 'Consulta falhou',
          tabelas_acessadas: ['venda'],
          competencias: ['2025-11'],
          filtros: null,
          sql_executado: 'SELECT * FROM inexistente',
          registros_retornados: 0,
          dados: null,
          tempo_ms: 120,
          situacao: 'ERRO',
          mensagem_erro: 'Tabela não encontrada',
        },
      ],
    }

    const [evento] = eventosDaTrilha(trilhaComErro)
    expect(evento).toBeDefined()
    expect(evento?.situacao).toBe('ERRO: Tabela não encontrada')
    expect(evento?.result).toBeUndefined()
  })
})
