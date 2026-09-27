import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ParametroCampo from '../components/ParametroCampo.vue'
import ParametrosPanel from '../components/ParametrosPanel.vue'
import ResultadoSimulacao from '../components/ResultadoSimulacao.vue'
import SecaoExpansivel from '../components/SecaoExpansivel.vue'
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

    await wrapper.findAll('button').find((b) => b.text() === 'Azul')?.trigger('click')

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
  it('mostra que a campanha está pronta quando nada falta', () => {
    const wrapper = mount(ParametrosPanel, {
      props: { regra: regraBlackFriday(), camposVazios: [], podeSimular: true, simulando: false },
    })

    expect(wrapper.find('.ficha-status').text()).toBe('Pronta para simular')
    expect(wrapper.find('.ficha-simular').attributes('disabled')).toBeUndefined()
  })

  it('bloqueia o botão e diz quantos campos faltam', () => {
    const wrapper = mount(ParametrosPanel, {
      props: { regra: regraBlackFriday(), camposVazios: ['meta_vendas', 'orcamento_limite'], podeSimular: false, simulando: false },
    })

    expect(wrapper.find('.ficha-status').text()).toBe('2 pendentes')
    expect(wrapper.find('.ficha-simular').attributes('disabled')).toBeDefined()
  })
})

describe('Recolher o painel', () => {
  it('pede para recolher com um botão que tem nome acessível', async () => {
    const wrapper = mount(ParametrosPanel, {
      props: { regra: regraBlackFriday(), camposVazios: [], podeSimular: true, simulando: false },
    })

    await wrapper.find('button[aria-label="Recolher o painel"]').trigger('click')

    expect(wrapper.emitted('recolher')).toHaveLength(1)
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

describe('Resultado com impacto e cenários', () => {
  it('mostra pessoas impactadas e a meta como histórico', () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoBlackFriday() } })

    expect(texto(wrapper)).toContain('312 de 548 pessoas')
    expect(texto(wrapper)).toContain('120,31% da meta (20,31% acima da meta)')
    expect(texto(wrapper)).not.toContain('atingida')
  })

  it('troca a quebra do custo pelas abas e mostra a fatia de cada loja', async () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoBlackFriday() } })
    expect(texto(wrapper)).not.toContain('Loja 13')

    await wrapper.findAll('.detalhe-aba').find((aba) => aba.text() === 'Lojas')?.trigger('click')

    expect(texto(wrapper.find('.detalhe-linhas'))).toContain('Loja 13')
    expect(texto(wrapper.find('.detalhe-linhas'))).toContain('9%') // 2.140,10 de 23.736,17
  })

  it('emite o cenário escolhido para ir ao painel', async () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoBlackFriday() } })

    await wrapper.findAll('.cenario-aplicar')[0]?.trigger('click')

    expect(wrapper.emitted('aplicar-cenario')?.[0]?.[0]).toMatchObject({ pct_acrescimo: 0.84 })
  })
})

describe('SecaoExpansivel', () => {
  it('abre e fecha pelo botão, e fechada não deixa o conteúdo receber foco', async () => {
    window.matchMedia = ((consulta: string) => ({ matches: true, media: consulta })) as typeof window.matchMedia
    // O jsdom não implementa rolagem; só importa que abrir peça para mostrar o conteúdo.
    const rolar = vi.fn()
    Element.prototype.scrollIntoView = rolar
    const wrapper = mount(SecaoExpansivel, { props: { titulo: 'Onde o custo pesa' }, slots: { default: '<p>Marca</p>' } })
    const botao = wrapper.find('button')
    expect(botao.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.secao-corpo').attributes('inert')).toBeDefined()

    await botao.trigger('click')

    expect(botao.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.secao-corpo').attributes('inert')).toBeUndefined()
    expect(rolar).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' })
  })
})
