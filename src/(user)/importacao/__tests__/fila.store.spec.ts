import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { criarServicoImportacao } from '../services/importacao'
import { definirServicoImportacao, useImportacaoStore } from '../stores/importacao'
import { FakeBackendImportacao, FakeEspera, envio, job, planilha } from './fakes'

let backend: FakeBackendImportacao

beforeEach(() => {
  setActivePinia(createPinia())
  backend = new FakeBackendImportacao()
  definirServicoImportacao(criarServicoImportacao(backend.http(), new FakeEspera().esperar))
})

function escolherDoisMeses(): void {
  useImportacaoStore().escolher([
    planilha('BASE_VENDAS_AGO25.xlsx'), planilha('BASE RH_AGO25.xlsx'),
    planilha('BASE RH_JUL25.xlsx'), planilha('BASE_VENDAS_JUL25.xlsx'), planilha('BASE_COMMISS_FINAL.xlsx'),
  ])
}

const roteiro = () => backend.pedidos.map((p) => `${p.metodo} ${p.url}${p.arquivos.length ? ` ${p.arquivos.join(' + ')}` : ''}`)

describe('fila de importação, um mês por vez', () => {
  it('envia cada mês só depois que o anterior termina, em ordem cronológica', async () => {
    backend.programar(1, job(1, 'PROCESSANDO'), job(1, 'CONCLUIDO'))
    escolherDoisMeses()

    await useImportacaoStore().importar()

    expect(roteiro()).toEqual([
      'post /api/importacao BASE RH_JUL25.xlsx + BASE_VENDAS_JUL25.xlsx + BASE_COMMISS_FINAL.xlsx',
      'get /api/importacao/1', 'get /api/importacao/1', 'get /api/importacao',
      'post /api/importacao BASE RH_AGO25.xlsx + BASE_VENDAS_AGO25.xlsx',
      'get /api/importacao/2', 'get /api/importacao',
    ])
  })

  it('um mês com impeditivo não para os outros: cada um fica com a sua situação e o seu relatório', async () => {
    backend.programar(1, job(1, 'PENDENTE'))
    escolherDoisMeses()
    const store = useImportacaoStore()

    await store.importar()

    expect(store.fila.map((m) => [m.competencia, m.situacao, m.jobId])).toEqual([
      ['2025-07', 'PENDENTE', 1],
      ['2025-08', 'CONCLUIDO', 2],
    ])
    expect(store.enviando).toBe(false)
  })

  it('envio recusado (409) interrompe a fila: aquele mês e os seguintes ficam sem enviar, com o motivo', async () => {
    backend.recusarEnvio = 409
    escolherDoisMeses()
    const store = useImportacaoStore()

    await store.importar()

    expect(store.fila.map((m) => m.situacao)).toEqual(['NAO_ENVIADO', 'NAO_ENVIADO'])
    expect(store.erroDaFila).toBe('Já existe uma importação em andamento. Espere ela terminar para enviar outra.')
    expect(roteiro().filter((p) => p.startsWith('post'))).toHaveLength(1)
  })

  it('com problema nas planilhas não envia nada', async () => {
    const store = useImportacaoStore()
    store.escolher([planilha('BASE RH_JUL25.xlsx')])

    await store.importar()

    expect(store.podeImportar).toBe(false)
    expect(backend.pedidos).toEqual([])
  })

  it('fecharFila só limpa a fila depois que ela termina, para escolher outras planilhas', async () => {
    backend.programar(1, job(1, 'PROCESSANDO'), job(1, 'CONCLUIDO'))
    escolherDoisMeses()
    const store = useImportacaoStore()

    const rodando = store.importar()
    store.fecharFila()
    expect(store.fila).toHaveLength(2)
    await rodando
    store.fecharFila()

    expect(store.fila).toEqual([])
  })

  it('a mesma planilha escolhida duas vezes conta uma vez, e dá para remover antes de enviar', () => {
    const store = useImportacaoStore()
    store.escolher([planilha('BASE RH_JUL25.xlsx', 10), planilha('BASE_VENDAS_JUL25.xlsx')])
    store.escolher([planilha('BASE RH_JUL25.xlsx', 20)])
    store.remover('BASE_VENDAS_JUL25.xlsx')

    expect(store.escolhidas.map((a) => [a.name, a.size])).toEqual([['BASE RH_JUL25.xlsx', 20]])
  })
})

describe('histórico e importação que já estava rodando', () => {
  it('ao abrir a tela, retoma o acompanhamento do job PROCESSANDO e atualiza o histórico no fim', async () => {
    backend.historico = [envio(9, 'PROCESSANDO', null), envio(8, 'CONCLUIDO', '2025-09')]
    backend.programar(9, job(9, 'PROCESSANDO'), job(9, 'CONCLUIDO'))
    const store = useImportacaoStore()

    await store.carregarHistorico()

    expect(store.fila.map((m) => [m.situacao, m.jobId])).toEqual([['CONCLUIDO', 9]])
    expect(roteiro()).toEqual([
      'get /api/importacao', 'get /api/importacao/9', 'get /api/importacao/9', 'get /api/importacao',
    ])
  })

  it('falha ao carregar o histórico fica marcada para a tela oferecer "Tentar de novo"', async () => {
    const store = useImportacaoStore()
    definirServicoImportacao({
      ...criarServicoImportacao(backend.http()),
      historico: () => Promise.reject(new Error('sem rede')),
    })

    await store.carregarHistorico()

    expect(store.falhaNoHistorico).toBe(true)
  })
})
