import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FerramentasDropdown from '../components/FerramentasDropdown.vue'
import type { EventoAgente } from '../types'

describe('FerramentasDropdown', () => {
  const eventosExemplo: EventoAgente[] = [
    {
      ferramenta: 'consultar_banco',
      descricao_legivel: 'Consultando faturamento histórico',
      tempo: 1250,
      situacao: 'ok',
      sql: 'SELECT * FROM fato_movimentacao_mensal',
      tabelas: ['fato_movimentacao_mensal'],
      competencias: ['2025-07', '2025-12'],
      registros: 10,
    },
    {
      ferramenta: 'registrar_parametro_regra',
      descricao_legivel: 'Registrando parâmetros da campanha',
      tempo: 400,
      situacao: 'ok',
      args: { pct_acrescimo: 1.0 },
    },
    {
      ferramenta: 'outra_ferramenta_desconhecida',
      descricao_legivel: 'Tentativa de operação externa',
      tempo: 0,
      situacao: 'erro: conexão recusada',
    },
  ]

  beforeEach(() => {
    localStorage.clear()
  })

  it('não renderiza nada se o array de eventos for vazio', () => {
    const wrapper = mount(FerramentasDropdown, {
      props: { events: [] },
    })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('renderiza o botão principal com a contagem de ferramentas', () => {
    const wrapper = mount(FerramentasDropdown, {
      props: { events: eventosExemplo },
    })

    const botaoPrincipal = wrapper.find('button')
    expect(botaoPrincipal.text()).toContain('3 ferramentas')
  })

  it('abre a lista ao clicar no botão principal e gira o chevron em 180 graus', async () => {
    const wrapper = mount(FerramentasDropdown, {
      props: { events: eventosExemplo },
    })

    const botaoPrincipal = wrapper.find('button')
    const chevronPrincipal = botaoPrincipal.find('i.bi-chevron-down')

    expect(chevronPrincipal.classes()).not.toContain('rotate-180')
    expect(wrapper.text()).not.toContain('Consultando faturamento histórico')

    await botaoPrincipal.trigger('click')

    expect(chevronPrincipal.classes()).toContain('rotate-180')
    expect(wrapper.text()).toContain('Consultando faturamento histórico')
  })

  it('converte tempo de ms para segundos com pelo menos 1 casa decimal', async () => {
    const wrapper = mount(FerramentasDropdown, {
      props: { events: eventosExemplo },
    })
    await wrapper.find('button').trigger('click')

    // 1250 ms -> 1.3s
    expect(wrapper.text()).toContain('1.3s')
    // 400 ms -> 0.4s
    expect(wrapper.text()).toContain('0.4s')
    // 0 ms -> 0.0s
    expect(wrapper.text()).toContain('0.0s')
  })

  it('aplica os ícones corretos: database-fill, sliders2 e fallback bi-tools', async () => {
    const wrapper = mount(FerramentasDropdown, {
      props: { events: eventosExemplo },
    })
    await wrapper.find('button').trigger('click')

    expect(wrapper.find('i.bi-database-fill').exists()).toBe(true)
    expect(wrapper.find('i.bi-sliders2').exists()).toBe(true)
    expect(wrapper.find('i.bi-tools').exists()).toBe(true)
  })

  it('ícone fica vermelho em caso de erro e azul em caso de sucesso', async () => {
    const wrapper = mount(FerramentasDropdown, {
      props: { events: eventosExemplo },
    })
    await wrapper.find('button').trigger('click')

    const iconeBanco = wrapper.find('i.bi-database-fill')
    const iconeRegra = wrapper.find('i.bi-sliders2')
    const iconeErro = wrapper.find('i.bi-tools')

    expect(iconeBanco.classes()).toContain('text-blue')
    expect(iconeRegra.classes()).toContain('text-blue')
    expect(iconeErro.classes()).toContain('text-red')
  })

  it('aplica hover vermelho no texto e chevron quando há erro e azul no sucesso', async () => {
    const wrapper = mount(FerramentasDropdown, {
      props: { events: eventosExemplo },
    })
    await wrapper.find('button').trigger('click')

    const botoes = wrapper.findAll('button.group\\/tool')
    const textoSucesso = botoes[0]!.find('span.truncate')
    const textoErro = botoes[2]!.find('span.truncate')

    expect(textoSucesso.classes()).toContain('group-hover/tool:text-blue')
    expect(textoErro.classes()).toContain('group-hover/tool:text-red')
  })

  it('não exibe status ok, e exibe componente de erro quando houver erro', async () => {
    const wrapper = mount(FerramentasDropdown, {
      props: { events: eventosExemplo },
    })
    await wrapper.find('button').trigger('click')

    const botoes = wrapper.findAll('button.group\\/tool')
    // Abre a ferramenta com sucesso
    await botoes[0]!.trigger('click')
    // Não deve conter componente de erro nem etiqueta de sucesso "ok"
    expect(wrapper.find('.border-red').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('ok')

    // Abre a ferramenta com erro
    await botoes[2]!.trigger('click')
    const alertaErro = wrapper.find('.border-red')
    expect(alertaErro.exists()).toBe(true)
    expect(alertaErro.find('i.bi-exclamation-triangle-fill').exists()).toBe(true)
    expect(alertaErro.text()).toContain('erro: conexão recusada')
  })

  it('usuário comum vê competências e registros, mas não vê nome da ferramenta nem SQL', async () => {
    localStorage.setItem('perfil', 'VENDEDOR')

    const wrapper = mount(FerramentasDropdown, {
      props: { events: eventosExemplo },
    })
    await wrapper.find('button').trigger('click')

    const botoes = wrapper.findAll('button.group\\/tool')
    await botoes[0]!.trigger('click')

    expect(wrapper.text()).toContain('Competências:')
    expect(wrapper.text()).toContain('2025-07')
    expect(wrapper.text()).toContain('Registros consultados:')
    expect(wrapper.text()).toContain('10')

    // Nome da ferramenta e SQL não devem aparecer para usuário comum
    expect(wrapper.text()).not.toContain('Nome da ferramenta:')
    expect(wrapper.text()).not.toContain('SQL gerado:')
    expect(wrapper.text()).not.toContain('SELECT * FROM fato_movimentacao_mensal')
  })

  it('usuário SUPERVISOR vê nome da ferramenta e SQL gerado', async () => {
    localStorage.setItem('perfil', 'SUPERVISOR')

    const wrapper = mount(FerramentasDropdown, {
      props: { events: eventosExemplo },
    })
    await wrapper.find('button').trigger('click')

    const botoes = wrapper.findAll('button.group\\/tool')
    await botoes[0]!.trigger('click')

    expect(wrapper.text()).toContain('Nome da ferramenta:')
    expect(wrapper.text()).toContain('consultar_banco')
    expect(wrapper.text()).toContain('SQL gerado:')
    expect(wrapper.text()).toContain('SELECT * FROM fato_movimentacao_mensal')
  })

  it('mostra numa tabela os dados que a consulta devolveu', async () => {
    const consulta: EventoAgente = {
      ferramenta: 'consultar_banco',
      descricao_legivel: 'Consultando as vendas da marca 30 em outubro de 2025',
      tempo: 340,
      situacao: 'ok',
      result: { status: 'sucesso', dados: [{ qtd_vendas: 188, total: 333666.01 }] },
    }
    const wrapper = mount(FerramentasDropdown, { props: { events: [consulta] } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('button.group\\/tool').trigger('click')

    expect(wrapper.text()).toContain('Dados retornados:')
    expect(wrapper.findAll('th').map((th) => th.text())).toEqual(['qtd_vendas', 'total'])
    expect(wrapper.findAll('td').map((td) => td.text())).toEqual(['188', '333.666,01'])
  })
})
