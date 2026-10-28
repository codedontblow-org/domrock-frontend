import { describe, expect, it } from 'vitest'
import {
  acharUltimoSimulacaoId,
  converterHistorico,
  converterMensagemReaberta,
  determinarPermissoesCampanha,
  extrairFichaEEstadoSimulacao,
} from '../reabrir'
import type { MensagemGravada } from '../types'
import { regraBlackFriday, resultadoBlackFriday } from './fakes'
import { campanhaReprovada } from '../../campanhas/__tests__/fakes'

describe('reabrir.ts', () => {
  describe('converterMensagemReaberta / converterHistorico', () => {
    it('converte mensagens mantendo ordem e mapeando papéis e trilha', () => {
      const historico: MensagemGravada[] = [
        { id: 101, papel: 'usuario', texto: 'Quero +1%', criada_em: '2026-10-21T12:58:10Z' },
        {
          id: 102,
          papel: 'lana',
          texto: 'Preenchi a ficha',
          regra: regraBlackFriday(),
          trilha: {
            modelo: 'gemini-3.5-flash-lite',
            tentativas: null,
            premissas: [],
            passos: [
              {
                ordem: 1,
                ferramenta: 'consultar_banco',
                descricao: 'Consulta out/25',
                tabelas_acessadas: ['venda'],
                competencias: ['2025-10'],
                filtros: null,
                sql_executado: null,
                registros_retornados: 1,
                dados: [{ total: 100 }],
                tempo_ms: 200,
                situacao: 'SUCESSO',
                mensagem_erro: null,
              },
            ],
          },
          criada_em: '2026-10-21T12:58:14Z',
        },
        {
          id: 103,
          papel: 'sistema',
          tipo: 'STATUS',
          texto: 'Enviado para análise — v1',
          criada_em: '2026-10-21T13:05:00Z',
        },
      ]

      const mensagens = converterHistorico(historico)
      expect(mensagens).toHaveLength(3)
      expect(mensagens[0]?.papel).toBe('usuario')
      expect(mensagens[1]?.papel).toBe('agente')
      expect(mensagens[1]?.events).toHaveLength(1)
      expect(mensagens[2]?.papel).toBe('sistema')
      expect(mensagens[2]?.tipo).toBe('STATUS')
    })

    it('anexa resultado da última simulação na mensagem SIMULACAO correspondente', () => {
      const msg: MensagemGravada = {
        id: 104,
        papel: 'sistema',
        tipo: 'SIMULACAO',
        texto: 'Simulação concluída: custo de R$ 23.736,10',
        simulacao_id: 345,
        criada_em: '2026-10-21T12:59:02Z',
      }
      const resultado = resultadoBlackFriday()

      const convertida = converterMensagemReaberta(msg, 345, resultado)
      expect(convertida.resultado).toEqual(resultado)

      const outraSimulacao = converterMensagemReaberta(msg, 999, resultado)
      expect(outraSimulacao.resultado).toBeUndefined()
    })
  })

  describe('determinarPermissoesCampanha (item 3)', () => {
    it('libera chat quando acoes contém RENOMEAR (autor + RASCUNHO)', () => {
      const perm = determinarPermissoesCampanha(['RENOMEAR', 'SUBMETER'])
      expect(perm.somenteLeitura).toBe(false)
      expect(perm.podeVoltarRascunho).toBe(false)
    })

    it('bloqueia chat e ativa botão quando acoes contém EDITAR (autor + REPROVADA)', () => {
      const perm = determinarPermissoesCampanha(['EDITAR', 'ARQUIVAR'])
      expect(perm.somenteLeitura).toBe(true)
      expect(perm.podeVoltarRascunho).toBe(true)
    })

    it('bloqueia chat sem botão quando acoes for vazia ou supervisor', () => {
      const perm = determinarPermissoesCampanha([])
      expect(perm.somenteLeitura).toBe(true)
      expect(perm.podeVoltarRascunho).toBe(false)
    })
  })

  describe('extrairFichaEEstadoSimulacao (item 4)', () => {
    it('restaura regra, simulacaoId e orcamento da ultima_simulacao da campanha', () => {
      const campanha = campanhaReprovada()
      const estado = extrairFichaEEstadoSimulacao(campanha, [])

      expect(estado.simulacaoId).toBe(345)
      expect(estado.regra?.rule_id).toBe('draft-1')
      expect(estado.regraSimulada).toBe(JSON.stringify(campanha.ultima_simulacao?.regra))
      expect(estado.cabeNoOrcamento).toBe(true)
    })

    it('sem ultima_simulacao, busca a regra da última mensagem lana', () => {
      const campanha = campanhaReprovada({ ultima_simulacao: null })
      const mensagens: MensagemGravada[] = [
        {
          id: 1,
          papel: 'lana',
          texto: 'primeira',
          regra: regraBlackFriday({ meta_vendas: 100 }),
          criada_em: '',
        },
        {
          id: 2,
          papel: 'lana',
          texto: 'segunda',
          regra: regraBlackFriday({ meta_vendas: 200 }),
          criada_em: '',
        },
      ]

      const estado = extrairFichaEEstadoSimulacao(campanha, mensagens)
      expect(estado.simulacaoId).toBeNull()
      const meta = estado.regra?.parametros.find((p) => p.key === 'meta_vendas')?.value
      expect(meta).toBe(200)
    })
  })

  describe('acharUltimoSimulacaoId (item 6)', () => {
    it('retorna o simulacao_id da última mensagem de simulação', () => {
      const mensagens: MensagemGravada[] = [
        { id: 1, papel: 'sistema', tipo: 'SIMULACAO', simulacao_id: 111, texto: '', criada_em: '' },
        { id: 2, papel: 'sistema', tipo: 'STATUS', texto: '', criada_em: '' },
        { id: 3, papel: 'sistema', tipo: 'SIMULACAO', simulacao_id: 222, texto: '', criada_em: '' },
      ]
      expect(acharUltimoSimulacaoId(mensagens)).toBe(222)
    })

    it('retorna null se não houver mensagem de simulação', () => {
      const mensagens: MensagemGravada[] = [
        { id: 1, papel: 'sistema', tipo: 'STATUS', texto: '', criada_em: '' },
      ]
      expect(acharUltimoSimulacaoId(mensagens)).toBeNull()
    })
  })
})
