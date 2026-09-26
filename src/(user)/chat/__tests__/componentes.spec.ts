import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ParametroCampo from '../components/ParametroCampo.vue'
import ParametrosPanel from '../components/ParametrosPanel.vue'
import ResultadoSimulacao from '../components/ResultadoSimulacao.vue'
import SpeechBubble from '../components/SpeechBubble.vue'
import { regraBlackFriday, resultadoBlackFriday } from './fakes'

// Intl.NumberFormat separa "R$" do número com espaço não separável (U+00A0).
function texto(wrapper: { text: () => string }): string {
  return wrapper.text().replace(/\u00a0/g, ' ')
}

function parametro(key: string, sobrescrever: Partial<Record<string, unknown>> = {}) {
  const encontrado = regraBlackFriday(sobrescrever).parametros.find((p) => p.key === key)
  if (!encontrado) throw new Error(`parâmetro ${key} não existe no fake`)
  return encontrado
}

describe('ParametroCampo', () => {
  it('escolher uma marca específica desmarca "Todas as marcas"', async () => {
    const wrapper = mount(ParametroCampo, { props: { parametro: parametro('marcas_alvo') } })

    await wrapper.findAll('button').find((b) => b.text() === 'AZUL (30)')?.trigger('click')

    expect(wrapper.emitted('alterar')?.[0]).toEqual([['30']])
  })

  it('marca o campo obrigatório vazio', () => {
    const wrapper = mount(ParametroCampo, { props: { parametro: parametro('orcamento_limite', { orcamento_limite: null }) } })

    expect(wrapper.text()).toContain('falta preencher')
  })

  it('emite número ao editar valor em reais', async () => {
    const wrapper = mount(ParametroCampo, { props: { parametro: parametro('meta_vendas') } })

    await wrapper.find('input').setValue('1500000')

    expect(wrapper.emitted('alterar')?.[0]).toEqual([1500000])
  })
})

describe('ParametrosPanel', () => {
  it('bloqueia o botão e diz quantos campos faltam', () => {
    const wrapper = mount(ParametrosPanel, {
      props: { regra: regraBlackFriday(), camposVazios: ['meta_vendas', 'orcamento_limite'], podeSimular: false, simulando: false },
    })

    expect(wrapper.text()).toContain('Preencha 2 campos para simular.')
    expect(wrapper.find('.ficha-simular').attributes('disabled')).toBeDefined()
  })
})

describe('ResultadoSimulacao', () => {
  it('mostra o custo extra e quanto do orçamento ele usa', () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoBlackFriday() } })

    expect(texto(wrapper.find('.resultado-custo'))).toBe('R$ 23.736,17')
    expect(texto(wrapper.find('.resultado-veredito'))).toContain('Sobram R$ 6.263,83')
    expect(wrapper.text()).toContain('Preto')
    expect(wrapper.text()).not.toContain('Branco') // sem diferença, não aparece
  })

  it('avisa quando a campanha estoura o orçamento', () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoBlackFriday(false) } })

    expect(texto(wrapper.find('.resultado-veredito'))).toContain('Passa R$ 3.736,17 do orçamento')
    expect(wrapper.find('.medidor--estourou').exists()).toBe(true)
  })
})

describe('SpeechBubble', () => {
  it('renderiza Markdown da Lana sem executar HTML injetado', () => {
    const wrapper = mount(SpeechBubble, {
      props: { papel: 'agente', message: '**ok** <img src=x onerror="alert(1)">' },
    })

    expect(wrapper.find('strong').text()).toBe('ok')
    expect(wrapper.html()).not.toContain('onerror')
  })
})
