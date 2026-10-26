import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CampanhasPage from '../Page.vue'
import { definirServicoCampanhas } from '../stores/campanhas'
import { erroDoBackend, FakeServicoCampanhas, resumoBlackFriday } from './fakes'

const pushMock = vi.fn()
// O store importa o `api`, que importa o router: o mock troca só o que a página usa.
vi.mock('vue-router', async (original) => ({
  ...(await original<typeof import('vue-router')>()),
  useRouter: () => ({ push: pushMock }),
}))

describe('Minhas Campanhas (Lista)', () => {
  let servico: FakeServicoCampanhas

  beforeEach(() => {
    setActivePinia(createPinia())
    servico = new FakeServicoCampanhas()
    servico.lista = [
      resumoBlackFriday(),
      resumoBlackFriday({
        id: 13, nome: 'Natal Premium', status: 'AGUARDANDO_APROVACAO', versao_atual: 2,
        periodo: { data_inicio: '2025-12-20', data_fim: '2025-12-31' }, custo_adicional: 45200,
      }),
      resumoBlackFriday({ id: 14, nome: 'Dia das Mães', status: 'APROVADA', versao_atual: 1, vigencia: 'ENCERRADA' }),
    ]
    definirServicoCampanhas(servico)
    pushMock.mockClear()
  })

  it('mostra cada campanha com os campos do contrato 5.4', async () => {
    const wrapper = mount(CampanhasPage)
    await flushPromises()

    const texto = wrapper.text().replace(/ /g, ' ')
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(texto).toContain('Black Friday 2025')
    expect(texto).toContain('R$ 23.736,10')
    expect(texto).toContain('24/11/2025 – 30/11/2025')
    expect(texto).toContain('Aguardando aprovação')
    expect(texto).toContain('v2')
    expect(texto).toContain('Encerrada')
  })

  it('campanha nunca submetida mostra "—" na versão', async () => {
    servico.lista = [resumoBlackFriday({ versao_atual: null })]
    const wrapper = mount(CampanhasPage)
    await flushPromises()

    expect(wrapper.findAll('tbody td')[3]!.text()).toBe('—')
  })

  it('o chip de status pede a lista filtrada ao backend', async () => {
    const wrapper = mount(CampanhasPage)
    await flushPromises()

    await wrapper.findAll('.filtro-chip').find((c) => c.text() === 'Aprovada')!.trigger('click')
    await flushPromises()

    expect(servico.filtrosPedidos).toEqual([undefined, 'APROVADA'])
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('Dia das Mães')
  })

  it('navega para o detalhe ao clicar na linha da campanha', async () => {
    const wrapper = mount(CampanhasPage)
    await flushPromises()

    await wrapper.find('tbody tr').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/campanhas/12')
  })

  it('mostra a mensagem do backend quando a lista falha', async () => {
    servico.falha = erroDoBackend(500, 'Erro ao listar campanhas')
    const wrapper = mount(CampanhasPage)
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe('Erro ao listar campanhas')
  })
})
