import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BotoesCampanha from '../components/BotoesCampanha.vue'
import ResumoCampanha from '../components/ResumoCampanha.vue'

describe('BotoesCampanha', () => {
  it('mostra um botão por item de `acoes`, na ordem do backend', () => {
    const wrapper = mount(BotoesCampanha, {
      props: { acoes: ['RENOMEAR', 'SUBMETER', 'ARQUIVAR'], status: 'RASCUNHO', agindo: false },
    })

    expect(wrapper.findAll('button').map((b) => b.text())).toEqual(['Renomear', 'Submeter para aprovação', 'Arquivar'])
  })

  it('sem `acoes` não mostra botão (só leitura)', () => {
    const wrapper = mount(BotoesCampanha, { props: { acoes: [], status: 'AGUARDANDO_APROVACAO', agindo: false } })

    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('emite a ação clicada', async () => {
    const wrapper = mount(BotoesCampanha, { props: { acoes: ['EDITAR', 'ARQUIVAR'], status: 'REPROVADA', agindo: false } })

    await wrapper.findAll('button')[0]!.trigger('click')

    expect(wrapper.emitted('acao')).toEqual([['EDITAR']])
  })

  it('desativa os botões enquanto uma ação está em andamento', () => {
    const wrapper = mount(BotoesCampanha, { props: { acoes: ['EDITAR'], status: 'REPROVADA', agindo: true } })

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('APROVADA mostra "Solicitar cancelamento", que não emite nada até o A6-88', async () => {
    const wrapper = mount(BotoesCampanha, { props: { acoes: [], status: 'APROVADA', agindo: false } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Solicitar cancelamento')
    expect(wrapper.emitted('acao')).toBeUndefined()
  })
})

describe('ResumoCampanha', () => {
  it('mostra nome, status e versão da campanha da conversa', () => {
    const wrapper = mount(ResumoCampanha, { props: { nome: 'Natal 2025', status: 'AGUARDANDO_APROVACAO', versao: 1 } })

    expect(wrapper.text()).toContain('Natal 2025')
    expect(wrapper.text()).toContain('Aguardando aprovação')
    expect(wrapper.text()).toContain('v1')
  })

  it('sem versão (nunca submetida) não mostra o número', () => {
    const wrapper = mount(ResumoCampanha, { props: { nome: 'Natal 2025', status: 'RASCUNHO', versao: null } })

    expect(wrapper.find('.resumo-campanha-versao').exists()).toBe(false)
  })
})
