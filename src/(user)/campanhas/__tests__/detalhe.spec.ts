import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CampanhaDetalhePage from '../[id]/Page.vue'
import { definirServicoCampanhas } from '../stores/campanhas'
import { regraBlackFriday, resultadoDoCriterio } from '../../chat/__tests__/fakes'
import { campanhaReprovada, erroDoBackend, FakeServicoCampanhas } from './fakes'

// O store importa o `api`, que importa o router: o mock troca só o que a página usa.
vi.mock('vue-router', async (original) => ({
  ...(await original<typeof import('vue-router')>()),
  useRoute: () => ({ params: { id: '12' } }),
}))

const STUBS = {
  teleport: true,
  RouterLink: { props: ['to'], template: '<a :data-to="JSON.stringify(to)"><slot /></a>' },
}

async function abrirDetalhe() {
  const wrapper = mount(CampanhaDetalhePage, { global: { stubs: STUBS } })
  await flushPromises()
  return wrapper
}

function botao(wrapper: Awaited<ReturnType<typeof abrirDetalhe>>, texto: string) {
  return wrapper.findAll('.header-acoes button').find((b) => b.text() === texto)!
}

describe('Detalhe da campanha', () => {
  let servico: FakeServicoCampanhas

  beforeEach(() => {
    setActivePinia(createPinia())
    servico = new FakeServicoCampanhas()
    definirServicoCampanhas(servico)
  })

  it('cabeçalho com nome, status, autora, período e versão do contrato 5.2', async () => {
    const wrapper = await abrirDetalhe()

    const cabecalho = wrapper.find('.detalhe-header').text()
    expect(cabecalho).toContain('Black Friday 2025')
    expect(cabecalho).toContain('Reprovada')
    expect(cabecalho).toContain('Gabriela')
    expect(cabecalho).toContain('24/11/2025 – 30/11/2025')
    expect(cabecalho).toContain('v1')
  })

  it('os botões são as `acoes` da campanha, e a ação devolve a campanha atualizada', async () => {
    const wrapper = await abrirDetalhe()
    expect(wrapper.findAll('.header-acoes button').map((b) => b.text())).toEqual(['Editar', 'Arquivar'])

    await botao(wrapper, 'Editar').trigger('click')
    await flushPromises()

    expect(servico.acoesFeitas).toEqual([{ id: 12, acao: 'EDITAR' }])
    expect(wrapper.find('.detalhe-header').text()).toContain('Rascunho')
    expect(botao(wrapper, 'Renomear').exists()).toBe(true)
  })

  it('Renomear abre o modal com o nome atual e manda o novo pelo PUT', async () => {
    servico.campanha = campanhaReprovada({ status: 'RASCUNHO', acoes: ['RENOMEAR', 'SUBMETER', 'ARQUIVAR'] })
    const wrapper = await abrirDetalhe()

    await botao(wrapper, 'Renomear').trigger('click')
    const campo = wrapper.find<HTMLInputElement>('#nome-campanha')
    expect(campo.element.value).toBe('Black Friday 2025')
    await campo.setValue('Black Friday 2025 - sem gerentes')
    await wrapper.findAll('.modal-rodape button').find((b) => b.text() === 'Renomear')!.trigger('click')
    await flushPromises()

    expect(servico.nomesPedidos).toEqual(['Black Friday 2025 - sem gerentes'])
    expect(wrapper.find('.detalhe-titulo').text()).toBe('Black Friday 2025 - sem gerentes')
  })

  it('a recusa do backend aparece na tela', async () => {
    const wrapper = await abrirDetalhe()
    servico.falha = erroDoBackend(409, 'Transição inválida')

    await botao(wrapper, 'Arquivar').trigger('click')
    await flushPromises()

    expect(wrapper.find('.erro-acao').text()).toBe('Transição inválida')
  })

  it('aba Versões mostra a v1 reprovada com a justificativa', async () => {
    const wrapper = await abrirDetalhe()

    await wrapper.findAll('.aba').find((a) => a.text() === 'Versões')!.trigger('click')

    const linha = wrapper.find('.versoes-tabela tbody tr').text()
    expect(linha).toContain('v1')
    expect(linha).toContain('Reprovada')
    expect(linha).toContain('a meta de R$ 2 milhões está abaixo da venda real do período')
  })

  it('aba Conversa reabre no chat a conversa da campanha (A6-92)', async () => {
    const wrapper = await abrirDetalhe()

    await wrapper.findAll('.aba').find((a) => a.text() === 'Conversa')!.trigger('click')

    expect(JSON.parse(wrapper.find('.link-conversa').attributes('data-to')!))
      .toEqual({ name: 'chat', query: { campanha: 12 } })
    expect(wrapper.find('.link-conversa').text()).toContain('Abrir a conversa no chat')
  })

  it('sem orçamento, a ficha mostra o custo e não mostra orçamento nem folga (A6-72)', async () => {
    servico.campanha = campanhaReprovada({
      ultima_simulacao: {
        id: 345, regra: regraBlackFriday({ orcamento_limite: null }), resultado: resultadoDoCriterio('sem_orcamento'),
        concluida_em: '2026-10-21T12:59:02Z',
      },
    })

    const wrapper = await abrirDetalhe()

    const resultado = wrapper.find('.resultado-grid').text().replace(/\u00a0/g, ' ')
    expect(resultado).toContain('R$ 23.736,10')
    expect(resultado).not.toContain('Orçamento limite')
    expect(resultado).not.toContain('Folga')
  })

  it('sem acesso, mostra a mensagem do backend', async () => {
    servico.falha = erroDoBackend(403, 'A campanha 12 é de outro usuário')
    const wrapper = await abrirDetalhe()

    expect(wrapper.find('.estado-vazio').text()).toBe('A campanha 12 é de outro usuário')
  })
})
