import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ModalCampanhaPassada from '../components/ModalCampanhaPassada.vue'
import type { DetalheAprovada } from '../montagem'

// Dado de teste
const campanha: DetalheAprovada = {
  id: 5,
  titulo: 'Natal', inicio: '01/12', fim: '24/12', percentual: '+1,5%', alcance: 'Afeta 2 cargos e 2 marcas.',
  custo: 'R$ 30.674,22', custoDetalhe: null, sugeridoPor: 'Gabriela', submetidoEm: '25/10', status: 'Aprovada',
  simulacaoId: 23,
}

function montar(valor: DetalheAprovada | null) {
  return mount(ModalCampanhaPassada, {
    props: { campanha: valor },
    global: { stubs: { teleport: true, RouterLink: { props: ['to'], template: '<a :data-to="JSON.stringify(to)"><slot /></a>' } } },
  })
}

describe('ModalCampanhaPassada', () => {
  it('mostra o cartão da campanha e o link para o chat da simulação', () => {
    const modal = montar(campanha)

    expect(modal.text()).toContain('Natal')
    expect(modal.text()).toContain('+1,5%')
    expect(JSON.parse(modal.find('.link-chat').attributes('data-to')!)).toEqual({ name: 'chat', query: { campanha: 5 } })
  })

  it('fecha pelo botão e pelo clique fora do cartão', async () => {
    const modal = montar(campanha)

    await modal.find('.modal-fechar').trigger('click')
    await modal.find('.modal-fundo').trigger('click')

    expect(modal.emitted('fechar')).toHaveLength(2)
  })

  it('sem campanha, não mostra nada', () => {
    expect(montar(null).find('.modal').exists()).toBe(false)
  })
})
