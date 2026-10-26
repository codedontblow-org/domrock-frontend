import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import RelatorioPage from '../relatorio/Page.vue'
import { criarServicoImportacao } from '../services/importacao'
import { definirServicoImportacao } from '../stores/importacao'
import { FakeBackendImportacao, FakeEspera, job, pendencia } from './fakes'

enableAutoUnmount(afterEach)

let backend: FakeBackendImportacao
let router: Router

beforeEach(() => {
  setActivePinia(createPinia())
  backend = new FakeBackendImportacao()
  definirServicoImportacao(criarServicoImportacao(backend.http(), new FakeEspera().esperar))
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/importar', name: 'importar', component: { template: '<p>importar</p>' } },
      { path: '/importar/:id', name: 'importar-relatorio', component: RelatorioPage },
    ],
  })
})

async function abrirRelatorio(id: number): Promise<VueWrapper> {
  await router.push(`/importar/${id}`)
  const tela = mount(RelatorioPage, { global: { plugins: [router] } })
  await flushPromises()
  return tela
}

function botao(tela: VueWrapper, texto: RegExp): DOMWrapper<HTMLButtonElement> {
  const achado = tela.findAll('button').find((b) => texto.test(b.text()))
  if (!achado) throw new Error(`botão ${texto} não existe; há: ${tela.findAll('button').map((b) => b.text()).join(' | ')}`)
  return achado
}

const linhasDaTabela = (tela: VueWrapper) => tela.findAll('[data-teste="pendencia"]').map((l) => l.text())

const semLoja = pendencia('IMPEDITIVO', 'Funcionário sem loja informada', 214)
const semVendas = pendencia('AVISO', 'Funcionário com matrícula MATRIC-356 não registrou vendas no mês')

describe('relatório de um envio (A6-79, protótipo 2005:1894 e 2005:2059)', () => {
  it('com impeditivo: alerta, nada gravado, abre no filtro Impeditivo e oferece enviar de novo', async () => {
    backend.programar(6, job(6, 'PENDENTE', { pendencias: [semVendas, semLoja] }))
    const tela = await abrirRelatorio(6)

    expect(tela.find('h1').text()).toBe('Envio de out/2025')
    expect(tela.find('[role="alert"]').text()).toBe('Planilha com pendências: corrija e envie novamente. Nada foi gravado.')
    expect(tela.text()).toContain('Importação não concluída')
    expect(botao(tela, /^Impeditivo · 1$/).attributes('aria-pressed')).toBe('true')
    expect(linhasDaTabela(tela)).toEqual([expect.stringMatching(/214.*Funcionário sem loja informada.*IMPEDITIVO/)])

    await botao(tela, /^Enviar novamente$/).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('importar')
  })

  it('concluída: números por planilha, sem alerta; o filtro Aviso mostra só os avisos e a linha 0 vira traço', async () => {
    backend.programar(6, job(6, 'CONCLUIDO', { pendencias: [semVendas, pendencia('AVISO', 'outra', 681)] }))
    const tela = await abrirRelatorio(6)

    expect(tela.find('[role="alert"]').exists()).toBe(false)
    expect(tela.find('[data-teste="numeros"]').text()).toMatch(/Linhas lidas\s*5\.469.*Linhas gravadas\s*5\.467.*RH\s*469.*Vendas\s*4\.998.*Comissão\s*0/)
    expect(botao(tela, /^Todas · 2$/).attributes('aria-pressed')).toBe('true')

    await botao(tela, /^Aviso · 2$/).trigger('click')
    expect(linhasDaTabela(tela)[0]).toMatch(/^BASE RH_OUT25\.xlsx\s*—\s*Matricula/)
    expect(tela.text()).not.toContain('Enviar novamente')
  })

  it('mostra 10 pendências e "Mostrar todas" abre o resto', async () => {
    const muitas = Array.from({ length: 12 }, (_, i) => pendencia('AVISO', `aviso ${i + 1}`, i + 2))
    backend.programar(6, job(6, 'CONCLUIDO', { pendencias: muitas }))
    const tela = await abrirRelatorio(6)

    expect(linhasDaTabela(tela)).toHaveLength(10)
    expect(tela.text()).toContain('Mostrando 10 de 12')

    await botao(tela, /^Mostrar todas$/).trigger('click')
    expect(linhasDaTabela(tela)).toHaveLength(12)
    expect(tela.text()).toContain('Mostrando 12 de 12')
  })

  it('envio ainda processando: acompanha até terminar e mostra o resultado', async () => {
    backend.programar(6, job(6, 'PROCESSANDO'), job(6, 'PROCESSANDO'), job(6, 'CONCLUIDO'))
    const tela = await abrirRelatorio(6)

    expect(tela.text()).toContain('Importação concluída')
    expect(backend.pedidos.filter((p) => p.url === '/api/importacao/6')).toHaveLength(3)
  })

  it('sem pendências diz que todas as linhas foram gravadas', async () => {
    backend.programar(6, job(6, 'CONCLUIDO', { pendencias: [] }))
    const tela = await abrirRelatorio(6)

    expect(tela.text()).toContain('Nenhuma pendência: todas as linhas foram gravadas.')
  })
})
