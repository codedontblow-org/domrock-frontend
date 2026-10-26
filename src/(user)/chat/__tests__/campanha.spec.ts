import axios from 'axios'
import { describe, expect, it } from 'vitest'
import { criarServicoCampanha, descreverFalha } from '../services/campanha'
import {
  FakeBackendSimulacao, FakeEspera, jobComErro, jobConcluido, jobCriado, jobRodando, regraBlackFriday,
} from './fakes'

async function falhaDe(promessa: Promise<unknown>): Promise<unknown> {
  return promessa.then(
    () => { throw new Error('esperava falha, a simulação concluiu') },
    (erro: unknown) => erro,
  )
}

describe('simulação como job (A6-66, contrato 4.1 e 4.2)', () => {
  it('pede a simulação e consulta a cada 2 s até concluir, avisando cada etapa', async () => {
    const backend = new FakeBackendSimulacao(jobCriado, [jobRodando(), jobConcluido()])
    const espera = new FakeEspera()
    const etapas: string[] = []
    const servico = criarServicoCampanha(backend.http(), espera.esperar)

    const { id, resultado } = await servico.simular('c1', regraBlackFriday(), (etapa) => etapas.push(etapa))

    expect(id).toBe(345)
    expect(resultado.totais.diferenca).toBe(23736.17)
    expect(etapas).toEqual(['Na fila', 'Simulando', 'Concluída'])
    expect(espera.esperas).toEqual([2000, 2000])
    expect(backend.pedidos.map((p) => `${p.metodo} ${p.url}`)).toEqual([
      'post /api/simulacoes', 'get /api/simulacoes/345', 'get /api/simulacoes/345',
    ])
    expect(backend.pedidos[0]?.corpo).toMatchObject({ chat_id: 'c1', regra: { rule_id: 'draft-1' } })
  })

  it('job que termina em ERRO vira falha com a mensagem que o backend gravou', async () => {
    const erroGravado = { etapa: 'lana_indisponivel', mensagem: 'Lana indisponível em /simulacao' }
    const backend = new FakeBackendSimulacao(jobCriado, [jobComErro(erroGravado)])
    const servico = criarServicoCampanha(backend.http(), new FakeEspera().esperar)

    const erro = await falhaDe(servico.simular('c1', regraBlackFriday(), () => {}))

    expect(descreverFalha(erro)).toBe('Lana indisponível em /simulacao')
  })

  it('erro de validação da Lana no job diz o que revisar', async () => {
    const erroGravado = { etapa: 'validacao', mensagem: 'Regra incompleta', erros: ['periodo: obrigatório'] }
    const backend = new FakeBackendSimulacao(jobCriado, [jobComErro(erroGravado)])
    const servico = criarServicoCampanha(backend.http(), new FakeEspera().esperar)

    const erro = await falhaDe(servico.simular('c1', regraBlackFriday(), () => {}))

    expect(descreverFalha(erro)).toBe('Revise a campanha: periodo: obrigatório')
  })
})

describe('salvar e submeter a campanha (contrato 5.3)', () => {
  it('salva com a simulação da conversa e submete pelo id da campanha', async () => {
    const pedidos: Array<{ url: string; corpo: unknown }> = []
    const http = axios.create({
      adapter: async (config) => {
        pedidos.push({ url: config.url ?? '', corpo: config.data ? JSON.parse(config.data as string) : undefined })
        const status = config.url === '/api/campanhas' ? 'RASCUNHO' : 'AGUARDANDO_APROVACAO'
        return { status: 200, statusText: '', headers: {}, config, data: { id: 12, nome: 'Natal 2025', status } }
      },
    })
    const servico = criarServicoCampanha(http)

    const salva = await servico.salvarCampanha('c1', 345, 'Natal 2025')
    const submetida = await servico.submeter(salva.id)

    expect(pedidos).toEqual([
      { url: '/api/campanhas', corpo: { nome: 'Natal 2025', chat_id: 'c1', simulacao_id: 345 } },
      { url: '/api/campanhas/12/submeter', corpo: undefined },
    ])
    expect(submetida.status).toBe('AGUARDANDO_APROVACAO')
  })
})
