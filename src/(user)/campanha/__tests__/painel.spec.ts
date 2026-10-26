import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PainelAprovacao from '../components/PainelAprovacao.vue'
import { INTERFERENCIAS_PROVISORIAS } from '../montagem'
import type { CampanhaAprovacao } from '../types'

// Dado de teste
const campanha: CampanhaAprovacao = {
  id: 7, versao: 1, titulo: 'Natal 2025', inicio: '01/12', fim: '24/12', duracaoDias: 24,
  sugeridoPor: 'Gabriela', submetidoEm: '25/10', status: 'Sem conflitos', custo: 'R$ 1.000,00',
  custoDetalhe: null, percentual: '+1,5%', alcance: null, detalhe: 'pronto', simulacaoId: 345,
  interferencias: INTERFERENCIAS_PROVISORIAS, acoes: ['APROVAR', 'REPROVAR', 'RESIMULAR'],
}

function montar(alterar: Partial<CampanhaAprovacao> = {}) {
  return mount(PainelAprovacao, {
    props: { campanha: { ...campanha, ...alterar } },
    attachTo: document.body,
    global: { stubs: { teleport: true, RouterLink: { props: ['to'], template: '<a :data-to="JSON.stringify(to)"><slot /></a>' } } },
  })
}

describe('PainelAprovacao', () => {
  it('com comentário escrito, aprovar fica inativo e não dispara', async () => {
    const painel = montar()
    const aprovar = painel.find('.acao--aprovar')
    expect(aprovar.attributes('disabled')).toBeUndefined()

    await painel.find('textarea').setValue('Reduzir o acréscimo')
    await aprovar.trigger('click')

    expect(aprovar.attributes('disabled')).toBeDefined()
    expect(painel.emitted('aprovar')).toBeUndefined()

    await painel.find('textarea').setValue('  ')
    expect(aprovar.attributes('disabled')).toBeUndefined()
    painel.unmount()
  })

  it('o link do chat abre a conversa da simulação da versão', () => {
    const painel = montar()

    expect(JSON.parse(painel.find('.link-chat').attributes('data-to')!)).toEqual({ name: 'chat', query: { simulacao: 345 } })
    painel.unmount()
  })

  it('com re-simulação pendente, aprovar some e o aviso diz por quê', () => {
    const aviso = 'Outra campanha deste período foi aprovada depois da submissão: Semana do Vendedor (Sílvia).'
    const painel = montar({ acoes: ['REPROVAR', 'RESIMULAR'], avisoResimulacao: aviso })

    expect(painel.find('.acao--aprovar').exists()).toBe(false)
    expect(painel.find('.bloco-alerta').text()).toBe(aviso)
    painel.unmount()
  })

  it('"Simular de novo" pede a re-simulação da campanha', async () => {
    const painel = montar()

    await painel.find('.acao--resimular').trigger('click')

    expect(painel.emitted('resimular')?.[0]?.[0]).toMatchObject({ id: 7 })
    painel.unmount()
  })

  it('depois de simular de novo, mostra o custo da submissão e o novo', () => {
    const painel = montar({ custoResimulado: 'R$ 1.200,00' })

    expect(painel.text()).toContain('Custo na submissão')
    expect(painel.text()).toContain('R$ 1.200,00')
    painel.unmount()
  })

  it('sem ações (autor ou versão já decidida), não mostra botão nem campo de devolução', () => {
    const painel = montar({ acoes: [] })

    expect(painel.findAll('.acao')).toHaveLength(0)
    expect(painel.find('textarea').exists()).toBe(false)
    painel.unmount()
  })

  it('mostra as interferências e não a seção de limites da simulação', () => {
    const painel = montar()

    expect(painel.text()).toContain('Interferências')
    expect(painel.text()).toContain('Sem estoque de produtos da marca Cinza')
    expect(painel.text()).not.toContain('Limites da simulação')
    painel.unmount()
  })
})
