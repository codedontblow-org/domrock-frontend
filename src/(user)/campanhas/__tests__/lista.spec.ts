import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CampanhasPage from '../Page.vue'
import { definirServicoCampanhas, useCampanhasStore } from '../stores/campanhas'
import type { CampanhaDetalhe, CampanhaResumo } from '../types'
import type { ServicoCampanhas } from '../services/campanhas'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

class FakeServico implements ServicoCampanhas {
  lista: CampanhaResumo[] = [
    {
      id: 1,
      nome: 'Black Friday 2025',
      status: 'RASCUNHO',
      versao_atual: 1,
      periodo_inicio: '2025-11-24',
      periodo_fim: '2025-11-30',
      custo_incremental: 23736.1,
      atualizada_em: '2025-11-20T10:00:00Z',
      autor_nome: 'Você',
    },
    {
      id: 2,
      nome: 'Natal Premium',
      status: 'AGUARDANDO_APROVACAO',
      versao_atual: 2,
      periodo_inicio: '2025-12-20',
      periodo_fim: '2025-12-31',
      custo_incremental: 45200.0,
      atualizada_em: '2025-11-21T10:00:00Z',
      autor_nome: 'Você',
    },
    {
      id: 3,
      nome: 'Dia das Mães',
      status: 'APROVADA',
      versao_atual: 1,
      periodo_inicio: '2025-05-01',
      periodo_fim: '2025-05-11',
      custo_incremental: 18900.5,
      atualizada_em: '2025-11-22T10:00:00Z',
      autor_nome: 'Você',
    },
  ]

  async listar(): Promise<CampanhaResumo[]> {
    return [...this.lista]
  }

  async obter(id: number): Promise<CampanhaDetalhe> {
    const c = this.lista.find((x) => x.id === id)
    if (!c) throw new Error('Não encontrada')
    return {
      ...c,
      autor_id: 1,
      rule_id: 'r1',
      chat_id: 'c1',
      parametros: [],
      resultado_simulacao: null,
      versoes: [],
      mensagens: [],
    }
  }

  async salvar(_chatId: string, nome: string, _regraId: string): Promise<CampanhaResumo> {
    const nova: CampanhaResumo = {
      id: 99,
      nome,
      status: 'RASCUNHO',
      versao_atual: 1,
      periodo_inicio: '2025-11-24',
      periodo_fim: '2025-11-30',
      custo_incremental: 23736.1,
      atualizada_em: new Date().toISOString(),
      autor_nome: 'Você',
    }
    this.lista.unshift(nova)
    return nova
  }

  async executarAcao(id: number): Promise<CampanhaResumo> {
    return this.lista.find((c) => c.id === id)!
  }
}

describe('Minhas Campanhas (Lista)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    definirServicoCampanhas(new FakeServico())
    pushMock.mockClear()
  })

  it('renderiza a tabela com as campanhas e colunas esperadas', async () => {
    const wrapper = mount(CampanhasPage)
    // aguarda onMounted
    await vi.waitFor(() => {
      expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    })

    const texto = wrapper.text().replace(/\u00a0/g, ' ')
    expect(texto).toContain('Black Friday 2025')
    expect(texto).toContain('R$ 23.736,10')
    expect(texto).toContain('Rascunho')
    expect(texto).toContain('Natal Premium')
    expect(texto).toContain('Aguardando aprovação')
  })

  it('filtra as campanhas ao clicar no chip de status', async () => {
    const wrapper = mount(CampanhasPage)
    await vi.waitFor(() => {
      expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    })

    const chipAprovada = wrapper.findAll('.filtro-chip').find((c) => c.text() === 'Aprovada')
    await chipAprovada?.trigger('click')

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('Dia das Mães')
    expect(wrapper.text()).not.toContain('Natal Premium')
  })

  it('navega para o detalhe ao clicar na linha da campanha', async () => {
    const wrapper = mount(CampanhasPage)
    await vi.waitFor(() => {
      expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    })

    await wrapper.find('tbody tr').trigger('click')
    expect(pushMock).toHaveBeenCalledWith('/campanhas/1')
  })
})

