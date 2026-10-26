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
  interferencias: INTERFERENCIAS_PROVISORIAS,
}

function montar() {
  return mount(PainelAprovacao, {
    props: { campanha },
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

  it('mostra as interferências e não a seção de limites da simulação', () => {
    const painel = montar()

    expect(painel.text()).toContain('Interferências')
    expect(painel.text()).toContain('Sem estoque de produtos da marca Cinza')
    expect(painel.text()).not.toContain('Limites da simulação')
    painel.unmount()
  })
})
