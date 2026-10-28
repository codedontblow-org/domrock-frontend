import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Sidebar from '../Sidebar.vue'
import { useChatStore } from '@/(user)/chat/stores/chat'
import { definirServicoSeusChats } from '@/(user)/campanhas/useSeusChats'
import { FakeServicoCampanhas, resumoBlackFriday } from '@/(user)/campanhas/__tests__/fakes'

const rotasNavegadas: unknown[] = []
const mockPush = vi.fn((rota: unknown) => {
  rotasNavegadas.push(rota)
})

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRouter: () => ({ push: mockPush }),
    useRoute: () => ({ path: '/', fullPath: '/' }),
  }
})

describe('Sidebar.vue (Item 6 e 7)', () => {
  let servico: FakeServicoCampanhas

  beforeEach(() => {
    setActivePinia(createPinia())
    rotasNavegadas.length = 0
    mockPush.mockClear()
    localStorage.clear()
    servico = new FakeServicoCampanhas()
    definirServicoSeusChats(servico)

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('exibe a lista de chats com título e data quando houver campanhas', async () => {
    servico.lista = [
      resumoBlackFriday({
        id: 12,
        nome: 'Black Friday 2025',
        atualizada_em: '2026-10-21T13:00:12Z',
      }),
      resumoBlackFriday({ id: 14, nome: 'Natal 2025', atualizada_em: '2026-11-25T10:00:00Z' }),
    ]

    const wrapper = mount(Sidebar)
    await flushPromises()
    expect(wrapper.find('.sidebar-chats').exists()).toBe(true)

    const itens = wrapper.findAll('.chat-item')
    expect(itens).toHaveLength(2)
    expect(itens[0]?.text()).toContain('Black Friday 2025')
    expect(itens[0]?.text()).toContain('21/10')
  })

  it('clique em um chat navega para /chat com query da campanha', async () => {
    servico.lista = [resumoBlackFriday({ id: 12, nome: 'Black Friday 2025' })]

    const wrapper = mount(Sidebar)
    await flushPromises()
    await wrapper.find('.chat-item').trigger('click')

    expect(mockPush).toHaveBeenCalledWith({ name: 'chat', query: { campanha: 12 } })
  })

  it('oculta a seção Seus Chats quando a lista estiver vazia', async () => {
    servico.lista = []

    const wrapper = mount(Sidebar)
    await flushPromises()
    expect(wrapper.find('.sidebar-chats').exists()).toBe(false)
  })

  it('não carrega Seus Chats quando o perfil for ADMIN (item B5)', async () => {
    localStorage.setItem('perfil', 'ADMIN')
    servico.lista = [resumoBlackFriday()]

    const wrapper = mount(Sidebar)
    await flushPromises()

    expect(servico.filtrosPedidos).toHaveLength(0)
    expect(wrapper.find('.sidebar-chats').exists()).toBe(false)
  })

  it('clique no item nova-campanha chama novaConversa da store', async () => {
    const chat = useChatStore()
    const spyNovaConversa = vi.spyOn(chat, 'novaConversa')

    const wrapper = mount(Sidebar)
    await flushPromises()
    const botaoNova = wrapper
      .findAll('.menu-item')
      .find((el) => el.text().includes('Nova Campanha'))
    expect(botaoNova).toBeDefined()

    await botaoNova?.trigger('click')
    expect(spyNovaConversa).toHaveBeenCalled()
  })
})
