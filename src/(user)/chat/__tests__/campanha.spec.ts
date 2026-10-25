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

    const resultado = await servico.simular('c1', regraBlackFriday(), (etapa) => etapas.push(etapa))

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
