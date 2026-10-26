import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import ImportacaoPage from '../Page.vue'
import { criarServicoImportacao } from '../services/importacao'
import { definirServicoImportacao } from '../stores/importacao'
import { FakeBackendImportacao, FakeEspera, envio, job, planilha } from './fakes'

enableAutoUnmount(afterEach)

let backend: FakeBackendImportacao
let router: Router

beforeEach(async () => {
  setActivePinia(createPinia())
  backend = new FakeBackendImportacao()
  definirServicoImportacao(criarServicoImportacao(backend.http(), new FakeEspera().esperar))
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/importar', name: 'importar', component: ImportacaoPage },
      { path: '/importar/:id', name: 'importar-relatorio', component: { template: '<p>relatório</p>' } },
    ],
  })
  await router.push('/importar')
})

async function abrirTela(): Promise<VueWrapper> {
  const tela = mount(ImportacaoPage, { global: { plugins: [router] } })
  await flushPromises()
  return tela
}

async function escolher(tela: VueWrapper, ...nomes: string[]): Promise<void> {
  const entrada = tela.find('input[type="file"]')
  Object.defineProperty(entrada.element, 'files', { value: nomes.map((n) => planilha(n, 62_464)), configurable: true })
  await entrada.trigger('change')
}

function botao(raiz: VueWrapper | DOMWrapper<Element>, texto: string): DOMWrapper<HTMLButtonElement> {
  const achado = raiz.findAll('button').find((b) => b.text() === texto)
  if (!achado) throw new Error(`botão "${texto}" não existe; há: ${raiz.findAll('button').map((b) => b.text()).join(' | ')}`)
  return achado
}

const DOIS_MESES = ['BASE RH_JUL25.xlsx', 'BASE_VENDAS_JUL25.xlsx', 'BASE_COMMISS_FINAL.xlsx', 'BASE RH_AGO25.xlsx', 'BASE_VENDAS_AGO25.xlsx']

describe('tela "Importar base do mês" (A6-79)', () => {
  it('histórico mostra mês, situação, linhas gravadas e o link do relatório', async () => {
    backend.historico = [envio(8, 'CONCLUIDO', '2025-09'), envio(7, 'PENDENTE', '2025-08')]

    const linhas = (await abrirTela()).findAll('[data-teste="envio"]')

    expect(linhas.map((l) => l.text())).toEqual([
      expect.stringMatching(/set\/2025.*Sérgio.*Concluída.*5\.467 de 5\.469.*Ver relatório/),
      expect.stringMatching(/ago\/2025.*Sérgio.*Pendente.*0 de 5\.469.*Ver relatório/),
    ])
    expect(linhas[0]!.find('a').attributes('href')).toBe('/importar/8')
  })

  it('planilhas com problema aparecem na lista com o motivo, e o Importar fica desabilitado', async () => {
    const tela = await abrirTela()

    await escolher(tela, 'BASE RH_OUT25.xlsx')

    expect(tela.text()).toContain('Arquivos escolhidos (1)')
    expect(tela.text()).toContain('BASE RH_OUT25.xlsx')
    expect(tela.text()).toContain('out/2025: falta a planilha de Vendas')
    expect(botao(tela, 'Importar').element.disabled).toBe(true)
  })

  it('remover tira a planilha da lista', async () => {
    const tela = await abrirTela()
    await escolher(tela, 'BASE RH_OUT25.xlsx', 'BASE_VENDAS_OUT25.xlsx')

    await tela.find('button[aria-label="Remover BASE RH_OUT25.xlsx"]').trigger('click')

    expect(tela.text()).toContain('Arquivos escolhidos (1)')
    expect(tela.findAll('button[aria-label^="Remover"]').map((b) => b.attributes('aria-label'))).toEqual([
      'Remover BASE_VENDAS_OUT25.xlsx',
    ])
  })

  it('Importar pede confirmação mostrando os meses; Voltar fecha sem enviar', async () => {
    const tela = await abrirTela()
    await escolher(tela, ...DOIS_MESES)

    await botao(tela, 'Importar').trigger('click')
    const modal = tela.find('[role="dialog"]')
    expect(modal.text()).toMatch(/jul\/2025.*BASE RH_JUL25\.xlsx.*BASE_COMMISS_FINAL\.xlsx.*ago\/2025.*BASE_VENDAS_AGO25\.xlsx/)

    await botao(modal, 'Voltar').trigger('click')
    expect(tela.find('[role="dialog"]').exists()).toBe(false)
    expect(backend.pedidos.filter((p) => p.metodo === 'post')).toEqual([])
  })

  it('confirmar envia mês a mês e mostra cada mês com a situação e o relatório', async () => {
    backend.programar(1, job(1, 'PENDENTE', { competencia: '2025-07' }))
    backend.programar(2, job(2, 'CONCLUIDO', { competencia: '2025-08' }))
    const tela = await abrirTela()
    await escolher(tela, ...DOIS_MESES)
    await botao(tela, 'Importar').trigger('click')

    await botao(tela.find('[role="dialog"]'), 'Importar').trigger('click')
    await flushPromises()

    const meses = tela.findAll('[data-teste="mes-da-fila"]')
    expect(meses.map((m) => m.text())).toEqual([
      expect.stringMatching(/jul\/2025.*3 planilhas.*Pendente.*Ver relatório/),
      expect.stringMatching(/ago\/2025.*2 planilhas.*Concluída.*Ver relatório/),
    ])
    expect(meses[1]!.find('a').attributes('href')).toBe('/importar/2')
    expect(backend.pedidos.filter((p) => p.metodo === 'post')).toHaveLength(2)
  })

  it('um mês só: ao terminar abre o relatório dele', async () => {
    const tela = await abrirTela()
    await escolher(tela, 'BASE RH_OUT25.xlsx', 'BASE_VENDAS_OUT25.xlsx')
    await botao(tela, 'Importar').trigger('click')

    await botao(tela.find('[role="dialog"]'), 'Importar').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/importar/1')
  })

  it('"Nova importação" volta para a escolha depois que a fila termina', async () => {
    const tela = await abrirTela()
    await escolher(tela, ...DOIS_MESES)
    await botao(tela, 'Importar').trigger('click')
    await botao(tela.find('[role="dialog"]'), 'Importar').trigger('click')
    await flushPromises()

    await botao(tela, 'Nova importação').trigger('click')

    expect(tela.find('input[type="file"]').exists()).toBe(true)
    expect(tela.findAll('[data-teste="mes-da-fila"]')).toHaveLength(0)
  })
})
