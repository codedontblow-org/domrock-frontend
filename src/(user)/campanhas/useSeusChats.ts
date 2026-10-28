import { ref } from 'vue'
import { api } from '@/services/api'
import type { Chat } from '@/types/sidebar'
import { formatarDiaMes } from '../chat/formatacao'
import { criarServicoCampanhas, type ServicoCampanhas } from '../campanha/services/campanhas'

let servicoPadrao: ServicoCampanhas = criarServicoCampanhas(api)

/**
 * Injeta o serviço de campanhas usado pelo composable dos chats do menu lateral.
 *
 * @example
 * definirServicoSeusChats(new FakeServicoCampanhas())
 */
export function definirServicoSeusChats(servico: ServicoCampanhas): void {
  servicoPadrao = servico
}

/**
 * Carrega a lista de campanhas do usuário para a seção "Seus Chats" do menu lateral (contrato 5.4).
 * Preserva a ordem vinda do backend (sem as arquivadas, da mais recente para a mais antiga).
 *
 * @example
 * const { chats, carregar } = useSeusChats()
 * await carregar()
 */
export function useSeusChats(servico?: ServicoCampanhas) {
  const chats = ref<Chat[]>([])
  const carregando = ref(false)

  async function carregar(): Promise<void> {
    const s = servico ?? servicoPadrao
    carregando.value = true
    try {
      const campanhas = await s.minhas()
      chats.value = campanhas.map((campanha) => ({
        id: campanha.id,
        titulo: campanha.nome,
        data: formatarDiaMes(campanha.atualizada_em),
      }))
    } catch {
      chats.value = []
    } finally {
      carregando.value = false
    }
  }

  return { chats, carregando, carregar }
}
