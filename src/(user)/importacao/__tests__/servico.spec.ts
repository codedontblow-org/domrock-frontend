import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { criarServicoImportacao, descreverFalhaDoEnvio } from '../services/importacao'
import { FakeBackendImportacao, FakeEspera, job, planilha } from './fakes'

describe('serviço da importação (contrato 7)', () => {
  it('envia as planilhas no campo `arquivos` do multipart e devolve o job criado', async () => {
    const backend = new FakeBackendImportacao()
    const servico = criarServicoImportacao(backend.http(), new FakeEspera().esperar)

    const criado = await servico.enviar([planilha('BASE RH_OUT25.xlsx'), planilha('BASE_VENDAS_OUT25.xlsx')])

    expect(criado).toEqual({ id: 1, status: 'PROCESSANDO' })
    expect(backend.pedidos).toEqual([
      { metodo: 'post', url: '/api/importacao', arquivos: ['BASE RH_OUT25.xlsx', 'BASE_VENDAS_OUT25.xlsx'] },
    ])
  })

  it('consulta o job a cada 2 s até sair de PROCESSANDO, avisando cada estado', async () => {
    const backend = new FakeBackendImportacao()
    backend.programar(7, job(7, 'PROCESSANDO'), job(7, 'PROCESSANDO'), job(7, 'PENDENTE'))
    const espera = new FakeEspera()
    const vistos: string[] = []

    const final = await criarServicoImportacao(backend.http(), espera.esperar).acompanhar(7, (j) => vistos.push(j.status))

    expect(final.status).toBe('PENDENTE')
    expect(vistos).toEqual(['PROCESSANDO', 'PROCESSANDO', 'PENDENTE'])
    expect(espera.esperas).toEqual([2000, 2000, 2000])
    expect(backend.pedidos.map((p) => `${p.metodo} ${p.url}`)).toEqual([
      'get /api/importacao/7', 'get /api/importacao/7', 'get /api/importacao/7',
    ])
  })
})

describe('descreverFalhaDoEnvio', () => {
  function recusa(status: number): AxiosError {
    return new AxiosError('x', 'ERR', undefined, null, { status, statusText: '', headers: {}, config: {} as never, data: {} })
  }

  // O 400 e o 409 vêm do ResponseStatusException, sem `message` no corpo: o texto sai do status (contrato 7.1).
  it.each([
    [recusa(409), 'Já existe uma importação em andamento. Espere ela terminar para enviar outra.'],
    [recusa(400), 'O servidor recusou as planilhas. Confira se são .xlsx e se os nomes dizem o tipo e o mês.'],
    [recusa(403), 'Só o Supervisor pode importar a base do mês.'],
    [recusa(500), 'O servidor respondeu 500. Tente de novo.'],
    [new AxiosError('sem rede'), 'Sem resposta do servidor. Confira se o backend está no ar.'],
  ])('%#: %s', (erro, texto) => {
    expect(descreverFalhaDoEnvio(erro)).toBe(texto)
  })
})
