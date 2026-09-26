import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'

export interface Mensagem {
  id: string
  remetente: 'user' | 'ia'
  texto: string
  timestamp: number
  simulado?: boolean
}

const ROTA_CHAT = '/api/chat'

export const useChatStore = defineStore('chat', () => {
  const mensagens = ref<Mensagem[]>([])
  const carregando = ref(false)

  async function enviarMensagem(texto: string) {
    mensagens.value.push({
      id: crypto.randomUUID(),
      remetente: 'user',
      texto,
      timestamp: Date.now(),
    })

    carregando.value = true
    try {
      const { data } = await api.post(ROTA_CHAT, { texto })
      mensagens.value.push({
        id: crypto.randomUUID(),
        remetente: 'ia',
        texto: data.resposta ?? data.texto ?? '',
        timestamp: Date.now(),
      })
    } catch (erro) {
      mensagens.value.push({
        id: crypto.randomUUID(),
        remetente: 'ia',
        texto: 'Olá! Sou Lana, sua assistente especializada em estratégias de vendas...\n\n📊 Análise Atual de Vendas\n\nVendedores e Performance:\n• Ana Ribeiro: R$ 699,80\n...',
        timestamp: Date.now(),
        simulado: true,
      })
      console.warn(`Falha ao chamar ${ROTA_CHAT}`, erro)
    } finally {
      carregando.value = false
    }
  }

  return { mensagens, carregando, enviarMensagem }
})