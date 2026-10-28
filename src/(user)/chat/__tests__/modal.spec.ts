import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import CompartilharCampanhaModal from '../components/CompartilharCampanhaModal.vue'
import type { ConferenciaCampanha } from '../conferencia'
import type { EtapaAprovacao } from '../types'

interface PropsModal {
  nomeInicial?: string
  conferencia?: ConferenciaCampanha | null
  etapaAprovacao?: EtapaAprovacao
  erroEnvio?: string | null
}

function montarModal(propsParciais: PropsModal = {}): VueWrapper {
  return mount(CompartilharCampanhaModal, {
    props: {
      nomeInicial: propsParciais.nomeInicial ?? '',
      conferencia: propsParciais.conferencia ?? null,
      etapaAprovacao: propsParciais.etapaAprovacao ?? 'pronta',
      erroEnvio: propsParciais.erroEnvio ?? null,
    },
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a class="link-campanhas" :data-to="JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  })
}

describe('CompartilharCampanhaModal (sem store)', () => {
  it('desabilita o botão Publicar quando o nome está vazio e o habilita ao preencher', async () => {
    const wrapper = montarModal({ nomeInicial: '' })

    const botaoPublicar = wrapper.findAll('button').find((b) => b.text().includes('Publicar'))!
    expect(botaoPublicar.attributes('disabled')).toBeDefined()

    const input = wrapper.find('input[type="text"]')
    await input.setValue('Black Friday 2025')

    expect(botaoPublicar.attributes('disabled')).toBeUndefined()
  })

  it('emite o evento compartilhar com o nome digitado ao clicar em Publicar', async () => {
    const wrapper = montarModal({ nomeInicial: '' })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('Campanha de Natal')

    const botaoPublicar = wrapper.findAll('button').find((b) => b.text().includes('Publicar'))!
    await botaoPublicar.trigger('click')

    expect(wrapper.emitted('compartilhar')).toEqual([['Campanha de Natal']])
  })

  it('mostra erroEnvio passado por prop em elemento com role="alert"', () => {
    const wrapper = montarModal({ erroEnvio: 'Falha ao salvar campanha no servidor.' })

    const alerta = wrapper.find('[role="alert"]')
    expect(alerta.exists()).toBe(true)
    expect(alerta.text()).toContain('Falha ao salvar campanha no servidor.')
  })

  it('troca para "Campanha Compartilhada!" com o link para campanhas ao virar enviada', () => {
    const wrapper = montarModal({
      nomeInicial: 'Campanha de Verão',
      etapaAprovacao: 'enviada',
    })

    expect(wrapper.text()).toContain('Campanha Compartilhada!')
    expect(wrapper.text()).toContain('Campanha de Verão')
    expect(wrapper.text()).toContain('aba de campanhas')

    const link = wrapper.find('.link-campanhas')
    expect(link.attributes('data-to')).toContain('campanhas')

    const botoes = wrapper.findAll('button')
    expect(botoes).toHaveLength(1)
    expect(botoes[0]!.text()).toBe('Fechar')
  })

  it('não fecha o modal enquanto o envio está em andamento', async () => {
    const wrapper = montarModal({ etapaAprovacao: 'enviando', nomeInicial: 'Teste' })

    const botaoCancelar = wrapper.findAll('button').find((b) => b.text() === 'Cancelar')!
    expect(botaoCancelar.attributes('disabled')).toBeDefined()

    await botaoCancelar.trigger('click')
    expect(wrapper.emitted('fechar')).toBeUndefined()
  })

  it('exibe aviso de fora_do_orcamento e aviso de privacidade com ícone de alerta', () => {
    const wrapper = montarModal({ etapaAprovacao: 'fora_do_orcamento' })

    expect(wrapper.text()).toContain('O custo passa do orçamento. Dá para enviar assim mesmo')
    expect(wrapper.text()).toContain('Essa ação irá expor seu histórico de mensagens nesse chat.')
    expect(wrapper.find('.aviso-privacidade i.bi-exclamation-triangle').exists()).toBe(true)
  })

  it('emite fechar ao clicar em Cancelar', async () => {
    const wrapper = montarModal({ etapaAprovacao: 'pronta' })

    const botaoCancelar = wrapper.findAll('button').find((b) => b.text() === 'Cancelar')!
    await botaoCancelar.trigger('click')

    expect(wrapper.emitted('fechar')).toHaveLength(1)
  })

  it('exibe bloco de conferência e repassa conflitos da conferência', () => {
    const wrapper = montarModal({
      conferencia: {
        inicio: '2025-11-24',
        fim: '2025-11-30',
        acrescimo: 1.5,
        cargos: ['Gerente (150)'],
        marcas: ['Preto'],
        custoIncremental: 23736.17,
      },
    })

    expect(wrapper.find('details').exists()).toBe(true)
    expect(wrapper.text()).toContain('Conferir informações da campanha')
  })
})
