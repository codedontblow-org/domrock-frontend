import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MensagemSistema from '../components/MensagemSistema.vue'
import type { MensagemChat } from '../types'
import { resultadoBlackFriday } from './fakes'

describe('MensagemSistema.vue (Item 5)', () => {
  it('renderiza mensagem STATUS centralizada e discreta com data curta', () => {
    const mensagem: MensagemChat = {
      id: 1,
      chave: 's-1',
      papel: 'sistema',
      tipo: 'STATUS',
      texto: 'Reprovado por Sérgio: meta abaixo do histórico',
      criada_em: '2026-10-21T14:20:00Z',
    }

    const wrapper = mount(MensagemSistema, { props: { mensagem } })

    expect(wrapper.find('.linha-sistema').exists()).toBe(true)
    expect(wrapper.text()).toContain('Reprovado por Sérgio: meta abaixo do histórico')
    expect(wrapper.find('.botao-ver-resultado').exists()).toBe(false)
    expect(wrapper.find('.sistema-data').text()).toMatch(/\d{2}\/\d{2}/)
  })

  it('renderiza mensagem SIMULACAO com botão "Ver resultado" quando não tiver resultado anexado', async () => {
    const mensagem: MensagemChat = {
      id: 2,
      chave: 's-2',
      papel: 'sistema',
      tipo: 'SIMULACAO',
      texto: 'Simulação concluída: custo de R$ 23.736,10',
      simulacao_id: 345,
      criada_em: '2026-10-21T12:59:02Z',
    }

    const wrapper = mount(MensagemSistema, { props: { mensagem } })

    const botao = wrapper.find('.botao-ver-resultado')
    expect(botao.exists()).toBe(true)
    expect(botao.text()).toBe('Ver resultado')
    expect(wrapper.findComponent({ name: 'ResultadoSimulacao' }).exists()).toBe(false)

    await botao.trigger('click')
    expect(wrapper.emitted('verResultado')?.[0]).toEqual([345])
  })

  it('com prop carregando ativa, o botão fica desabilitado e exibe Carregando… (item B6)', async () => {
    const mensagem: MensagemChat = {
      id: 2,
      chave: 's-2',
      papel: 'sistema',
      tipo: 'SIMULACAO',
      texto: 'Simulação concluída: custo de R$ 23.736,10',
      simulacao_id: 345,
      criada_em: '2026-10-21T12:59:02Z',
    }

    const wrapper = mount(MensagemSistema, { props: { mensagem, carregando: true } })

    const botao = wrapper.find('.botao-ver-resultado')
    expect(botao.attributes('disabled')).toBeDefined()
    expect(botao.text()).toBe('Carregando…')

    await botao.trigger('click')
    expect(wrapper.emitted('verResultado')).toBeUndefined()
  })

  it('renderiza ResultadoSimulacao logo abaixo quando a mensagem já tiver resultado anexado', () => {
    const resultado = resultadoBlackFriday()
    const mensagem: MensagemChat = {
      id: 3,
      chave: 's-3',
      papel: 'sistema',
      tipo: 'SIMULACAO',
      texto: 'Simulação concluída: custo de R$ 23.736,10',
      simulacao_id: 345,
      criada_em: '2026-10-21T12:59:02Z',
      resultado,
    }

    const wrapper = mount(MensagemSistema, { props: { mensagem } })

    expect(wrapper.find('.botao-ver-resultado').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'ResultadoSimulacao' }).exists()).toBe(true)
  })
})
