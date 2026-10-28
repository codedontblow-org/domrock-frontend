import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChatPage from '../Page.vue'
import { useChatStore } from '../stores/chat'
import { regraBlackFriday } from './fakes'

// auth.ts importa o router (e com ele as telas); a página só precisa do nome de quem entrou.
vi.mock('@/services/auth', () => ({ usuarioLogado: () => ({ nome: 'Gabriela' }) }))
// Sem ?campanha: a página abre na conversa que a store já tem.
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }))

describe('página do chat', () => {
  it('mostra a etapa do job que o backend informa enquanto simula (A6-66)', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const chat = useChatStore()
    chat.mensagens = [{ id: 1, chave: 'l-1', papel: 'usuario', texto: 'Black Friday' }]
    chat.regra = regraBlackFriday()
    chat.simulando = true
    chat.etapaSimulacao = 'Na fila'

    const pagina = mount(ChatPage, { global: { plugins: [pinia] } })

    expect(pagina.find('.pensando').text()).toContain('Na fila')
  })

  it('exibe o botão Editar campanha e o aviso quando a campanha for reprovada (item 3)', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const chat = useChatStore()
    chat.mensagens = [{ id: 1, chave: 'l-1', papel: 'usuario', texto: 'Black Friday' }]
    chat.somenteLeitura = true
    chat.podeVoltarRascunho = true

    const spyEditar = vi.spyOn(chat, 'editarCampanhaReprovada').mockResolvedValue(undefined)

    const pagina = mount(ChatPage, { global: { plugins: [pinia] } })

    expect(pagina.text()).toContain('Esta campanha foi reprovada. Edite para voltar a conversar.')
    const botao = pagina.find('.botao-editar-campanha')
    expect(botao.exists()).toBe(true)
    expect(botao.text()).toBe('Editar campanha')
    expect(botao.attributes('disabled')).toBeUndefined()

    await botao.trigger('click')
    expect(spyEditar).toHaveBeenCalled()
  })

  it('botão Editar campanha fica desabilitado durante o carregamento da edição (item B4)', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const chat = useChatStore()
    chat.mensagens = [{ id: 1, chave: 'l-1', papel: 'usuario', texto: 'Black Friday' }]
    chat.somenteLeitura = true
    chat.podeVoltarRascunho = true
    chat.editandoCampanha = true

    const pagina = mount(ChatPage, { global: { plugins: [pinia] } })

    const botao = pagina.find('.botao-editar-campanha')
    expect(botao.attributes('disabled')).toBeDefined()
  })

  it('renderiza mensagem de sistema STATUS e SIMULACAO na conversa (item 5)', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const chat = useChatStore()
    chat.mensagens = [
      {
        id: 1,
        chave: 'b-1',
        papel: 'sistema',
        tipo: 'STATUS',
        texto: 'Reprovado por Sérgio: meta baixa',
        criada_em: '2026-10-21T14:20:00Z',
      },
      {
        id: 2,
        chave: 'b-2',
        papel: 'sistema',
        tipo: 'SIMULACAO',
        texto: 'Custo R$ 23.736,10',
        simulacao_id: 345,
        criada_em: '2026-10-21T12:59:02Z',
      },
    ]

    const spyCarregar = vi.spyOn(chat, 'carregarResultadoSimulacao').mockResolvedValue(undefined)

    const pagina = mount(ChatPage, { global: { plugins: [pinia] } })

    expect(pagina.text()).toContain('Reprovado por Sérgio: meta baixa')
    expect(pagina.text()).toContain('Custo R$ 23.736,10')
    const botaoVer = pagina.find('.botao-ver-resultado')
    expect(botaoVer.exists()).toBe(true)
    expect(botaoVer.text()).toBe('Ver resultado')

    await botaoVer.trigger('click')
    expect(spyCarregar).toHaveBeenCalledWith(345)
  })

  it('ao montar sem query com marca abertaPelaCampanha, inicia nova conversa (item B3)', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const chat = useChatStore()
    chat.abertaPelaCampanha = true
    chat.mensagens = [{ id: 10, chave: 'b-10', papel: 'usuario', texto: 'Campanha 12' }]
    const spyNova = vi.spyOn(chat, 'novaConversa')

    mount(ChatPage, { global: { plugins: [pinia] } })

    expect(spyNova).toHaveBeenCalled()
  })

  it('ao montar sem query de conversa salva no próprio chat, mantém a campanha na tela (item B3)', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const chat = useChatStore()
    chat.abertaPelaCampanha = false
    chat.campanha = { id: 25, nome: 'Minha Campanha', status: 'AGUARDANDO_APROVACAO', versao_atual: 1 }
    chat.mensagens = [{ id: 1, chave: 'l-1', papel: 'usuario', texto: 'Criada no chat' }]
    const spyNova = vi.spyOn(chat, 'novaConversa')

    const pagina = mount(ChatPage, { global: { plugins: [pinia] } })

    expect(spyNova).not.toHaveBeenCalled()
    expect(pagina.text()).toContain('Criada no chat')
  })
})
