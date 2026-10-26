import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BotoesCampanha from '../components/BotoesCampanha.vue'

describe('BotoesCampanha', () => {
  it('sem simulação → botão "Salvar campanha" está disabled', () => {
    const wrapper = mount(BotoesCampanha, {
      props: {
        podeSimular: false,
        campanhaId: null,
        status: null,
        nome: null,
        versao: null,
        salvando: false,
      },
    })
    const btn = wrapper.find('button')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toContain('Salvar campanha')
  })

  it('com simulação, sem salvar → botão "Salvar campanha" habilitado', () => {
    const wrapper = mount(BotoesCampanha, {
      props: {
        podeSimular: true,
        campanhaId: null,
        status: null,
        nome: null,
        versao: null,
        salvando: false,
      },
    })
    const btn = wrapper.find('button')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('com campanha salva em RASCUNHO → mostra botões Simular, Submeter, Arquivar', () => {
    const wrapper = mount(BotoesCampanha, {
      props: {
        podeSimular: true,
        campanhaId: 1,
        status: 'RASCUNHO',
        nome: 'Black Friday',
        versao: 1,
        salvando: false,
      },
    })
    const texto = wrapper.text()
    expect(texto).toContain('Simular')
    expect(texto).toContain('Submeter para aprovação')
    expect(texto).toContain('Arquivar')
  })

  it('com campanha AGUARDANDO_APROVACAO → sem botões de ação', () => {
    const wrapper = mount(BotoesCampanha, {
      props: {
        podeSimular: true,
        campanhaId: 2,
        status: 'AGUARDANDO_APROVACAO',
        nome: 'Natal',
        versao: 1,
        salvando: false,
      },
    })
    expect(wrapper.findAll('.campanha-acoes button')).toHaveLength(0)
  })

  it('emite "salvar" ao clicar no botão Salvar campanha', async () => {
    const wrapper = mount(BotoesCampanha, {
      props: {
        podeSimular: true,
        campanhaId: null,
        status: null,
        nome: null,
        versao: null,
        salvando: false,
      },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('salvar')).toBeTruthy()
  })

  it('emite "acao" com a ação correta ao clicar', async () => {
    const wrapper = mount(BotoesCampanha, {
      props: {
        podeSimular: true,
        campanhaId: 1,
        status: 'APROVADA',
        nome: 'Dia das Mães',
        versao: 1,
        salvando: false,
      },
    })
    const botoesAcao = wrapper.findAll('.campanha-acoes button')
    expect(botoesAcao).toHaveLength(1)
    await botoesAcao[0]!.trigger('click')
    expect(wrapper.emitted('acao')?.[0]).toEqual(['solicitar_cancelamento'])
  })
})
