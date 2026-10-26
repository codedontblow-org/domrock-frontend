import { describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import ParametroCampo from '../components/ParametroCampo.vue'
import ParametrosPanel from '../components/ParametrosPanel.vue'
import ResultadoSimulacao from '../components/ResultadoSimulacao.vue'
import SecaoExpansivel from '../components/SecaoExpansivel.vue'
import SpeechBubble from '../components/SpeechBubble.vue'
import { regraBlackFriday, resultadoBlackFriday, resultadoDoCriterio } from './fakes'

const SEM_SIMULACAO = { aprovacao: 'sem_simulacao', ocupado: false } as const

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

    expect(wrapper.text()).toContain('pendente')
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
      props: { regra: regraBlackFriday(), camposVazios: [], podeSimular: true, simulando: false, ...SEM_SIMULACAO },
    })

    expect(wrapper.find('.ficha-status').text()).toBe('Pronta para simular')
    expect(wrapper.find('.ficha-simular').attributes('disabled')).toBeUndefined()
  })

  it('bloqueia o botão e diz quantos campos faltam', () => {
    const wrapper = mount(ParametrosPanel, {
      props: { regra: regraBlackFriday(), camposVazios: ['meta_vendas', 'orcamento_limite'], podeSimular: false, simulando: false, ...SEM_SIMULACAO },
    })

    expect(wrapper.find('.ficha-status').text()).toBe('2 pendentes')
    expect(wrapper.find('.ficha-simular').attributes('disabled')).toBeDefined()
  })

  it('só oferece enviar para aprovação depois de simular', () => {
    const wrapper = mount(ParametrosPanel, {
      props: { regra: regraBlackFriday(), camposVazios: [], podeSimular: true, simulando: false, ...SEM_SIMULACAO },
    })

    expect(wrapper.find('.ficha-enviar').exists()).toBe(false)
  })

  it('envia o nome digitado e exige um nome', async () => {
    const wrapper = mount(ParametrosPanel, {
      props: { regra: regraBlackFriday(), camposVazios: [], podeSimular: true, simulando: false, aprovacao: 'pronta', ocupado: false },
    })
    expect(wrapper.find('.ficha-enviar').attributes('disabled')).toBeDefined()

    await wrapper.find('.ficha-nome').setValue('Natal 2025')
    await wrapper.find('.ficha-aprovacao').trigger('submit')

    expect(wrapper.emitted('enviarAprovacao')?.[0]).toEqual(['Natal 2025'])
  })

  it('avisa que precisa simular de novo quando a campanha mudou', () => {
    const wrapper = mount(ParametrosPanel, {
      props: { regra: regraBlackFriday(), camposVazios: [], podeSimular: true, simulando: false, aprovacao: 'desatualizada', ocupado: false },
    })

    expect(wrapper.find('.ficha-enviar').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.ficha-aprovacao').text()).toContain('simule de novo')
  })
})

describe('Orçamento em Extras (A6-72, padrão do Figma do time)', () => {
  function painel(orcamento: number | null) {
    const regra = regraBlackFriday({ orcamento_limite: orcamento })
    for (const p of regra.parametros) p.required = p.key !== 'orcamento_limite'
    return mount(ParametrosPanel, {
      props: { regra, camposVazios: [], podeSimular: true, simulando: false, ...SEM_SIMULACAO },
    })
  }

  it('sem orçamento, mostra o botão "Adicionar orçamento" e não o campo', () => {
    const wrapper = painel(null)

    expect(wrapper.find('#param-orcamento_limite').exists()).toBe(false)
    expect(wrapper.find('#param-meta_vendas').exists()).toBe(true)
    expect(wrapper.find('.extra-adicionar').text()).toBe('Adicionar orçamento')
    expect(wrapper.find('.extra-adicionar').attributes('disabled')).toBeUndefined()
  })

  it('o botão abre o campo e fica apagado', async () => {
    const wrapper = painel(null)

    await wrapper.find('.extra-adicionar').trigger('click')

    expect(wrapper.find('#param-orcamento_limite').exists()).toBe(true)
    expect(wrapper.find('.extra-adicionar').attributes('disabled')).toBeDefined()
  })

  it('orçamento já informado aparece, e a lixeira tira o valor', async () => {
    const wrapper = painel(20000)
    expect(wrapper.find('#param-orcamento_limite').exists()).toBe(true)

    await wrapper.find('button[aria-label="Tirar o orçamento"]').trigger('click')

    expect(wrapper.emitted('alterar')?.[0]).toEqual(['orcamento_limite', null])
  })

  it('a meta continua obrigatória: sem lixeira', () => {
    const wrapper = painel(20000)

    expect(wrapper.find('button[aria-label="Tirar a meta de vendas"]').exists()).toBe(false)
    expect(wrapper.findAll('button[aria-label^="Tirar"]')).toHaveLength(1)
  })
})

describe('Recolher o painel', () => {
  it('pede para recolher com um botão que tem nome acessível', async () => {
    const wrapper = mount(ParametrosPanel, {
      props: { regra: regraBlackFriday(), camposVazios: [], podeSimular: true, simulando: false, ...SEM_SIMULACAO },
    })

    await wrapper.find('button[aria-label="Recolher o painel"]').trigger('click')

    expect(wrapper.emitted('recolher')).toHaveLength(1)
  })
})

function blocos(wrapper: VueWrapper) {
  return wrapper.findAll('.bloco').map((b) => b.find('.bloco-titulo').text())
}

function bloco(wrapper: VueWrapper, titulo: string) {
  const encontrado = wrapper.findAll('.bloco').find((b) => b.find('.bloco-titulo').text() === titulo)
  if (!encontrado) throw new Error(`bloco ${titulo} não aparece; blocos: ${blocos(wrapper).join(', ')}`)
  return encontrado
}

// A Lana ainda manda o retorno provisório no resultado (contrato 2.3); a tela só o usa na Sprint 3.
const RETORNO_DA_LANA = { provisorio: true, custo_pct_venda: 0.99, custo_por_real_acima_meta: 0.06 }

describe('ResultadoSimulacao (A6-72)', () => {
  it('sem orçamento: Meta e Comissão, nessa ordem, com os números do critério', () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoDoCriterio('sem_orcamento') } })

    expect(blocos(wrapper)).toEqual(['Meta', 'Comissão'])
    expect(texto(bloco(wrapper, 'Meta'))).toContain('120,31%')
    expect(texto(bloco(wrapper, 'Meta'))).toContain('R$ 406.125,93 acima da meta')
    expect(texto(bloco(wrapper, 'Comissão').find('.bloco-destaque'))).toContain('R$ 23.736,10')
    expect(texto(wrapper)).not.toContain('Acréscimo menor, dentro do orçamento')
  })

  it('com orçamento de R$ 20.000: bloco Orçamento por último, com o maior acréscimo que cabe', () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoDoCriterio('orcamento_20_mil') } })

    expect(blocos(wrapper)).toEqual(['Meta', 'Comissão', 'Orçamento'])
    const orcamento = texto(bloco(wrapper, 'Orçamento'))
    expect(orcamento).toContain('Não cabe no orçamento')
    expect(orcamento).toContain('0,84%')
    expect(orcamento).toContain('R$ 19.938,34')
  })

  it('meta de R$ 3 milhões: Meta abaixo, com a diferença em reais', () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoDoCriterio('meta_3_milhoes') } })

    expect(texto(bloco(wrapper, 'Meta'))).toContain('80,20%')
    expect(texto(bloco(wrapper, 'Meta'))).toContain('R$ 593.874,07 abaixo da meta')
  })

  it('não mostra o retorno até a Sprint 3, mesmo vindo da Lana (decisão do PO, 26/10)', () => {
    const comRetorno = { ...resultadoDoCriterio('sem_orcamento'), retorno: RETORNO_DA_LANA }

    const wrapper = mount(ResultadoSimulacao, { props: { resultado: comRetorno } })

    expect(texto(wrapper)).not.toContain('Retorno')
    expect(texto(wrapper)).not.toContain('provisório')
  })

  it('"Sem a marca X" continua fora dos blocos, e sem orçamento não diz se cabe', () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoDoCriterio('sem_orcamento') } })

    const outros = wrapper.find('.resultado-fim')
    expect(outros.text()).toContain('Sem a marca Preto')
    expect(outros.find('.cenario-situacao').exists()).toBe(false)
  })

  it('não mostra o código Python a ninguém (decisão do PO, 26/10)', () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoBlackFriday() } })

    expect(wrapper.text()).not.toContain('def aplicar_regra')
    expect(wrapper.text()).not.toContain('Código Python')
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

  it('erro usa o texto claro do balão, e só o balão azul do usuário usa texto escuro', () => {
    // Regressão do #8: o erro saía com text-black-bg1, a mesma cor do fundo da página.
    const erro = mount(SpeechBubble, { props: { papel: 'erro', message: 'A Lana está indisponível' } })
    const usuario = mount(SpeechBubble, { props: { papel: 'usuario', message: 'Black Friday +1%' } })

    expect(erro.find('p').classes()).not.toContain('text-black-bg1')
    expect(usuario.find('p').classes()).toContain('text-black-bg1')
  })
})

describe('Resultado com impacto e cenários', () => {
  it('mostra pessoas impactadas no bloco Comissão', () => {
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoBlackFriday() } })

    expect(texto(bloco(wrapper, 'Comissão'))).toContain('312 de 548 pessoas')
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

describe('Rótulo pendente', () => {
  it('só o campo vazio fica marcado como pendente', () => {
    const wrapper = mount(ParametroCampo, { props: { parametro: parametro('meta_vendas') } })

    expect(wrapper.classes()).not.toContain('campo--faltando')
    expect(wrapper.text()).not.toContain('pendente')
  })
})
