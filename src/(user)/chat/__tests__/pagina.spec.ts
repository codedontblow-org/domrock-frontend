import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChatPage from '../Page.vue'
import { useChatStore } from '../stores/chat'
import { regraBlackFriday } from './fakes'

// auth.ts importa o router (e com ele as telas); a página só precisa do nome de quem entrou.
vi.mock('@/services/auth', () => ({ usuarioLogado: () => ({ nome: 'Gabriela' }) }))

describe('página do chat', () => {
  it('mostra a etapa do job que o backend informa enquanto simula (A6-66)', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const chat = useChatStore()
    chat.mensagens = [{ id: 1, papel: 'usuario', texto: 'Black Friday' }]
    chat.regra = regraBlackFriday()
    chat.simulando = true
    chat.etapaSimulacao = 'Na fila'

    const pagina = mount(ChatPage, { global: { plugins: [pinia] } })

    expect(pagina.find('.pensando').text()).toContain('Na fila')
  })
})
