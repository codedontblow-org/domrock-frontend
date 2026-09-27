import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'
import { criarServicoCampanha, descreverFalha, type ServicoCampanha } from '../services/campanha'
import type { CenarioAlternativo, MensagemChat, PapelMensagem, RegraCampanha, ValorParametro } from '../types'

let servicoCampanha: ServicoCampanha = criarServicoCampanha(api)

/** Troca o cliente HTTP da store (usado pelos testes com um serviço fake). */
export function definirServicoCampanha(servico: ServicoCampanha): void {
  servicoCampanha = servico
}

function novoChatId(): string {
  return `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const useChatStore = defineStore('chat', () => {
  const chatId = ref(novoChatId())
  const mensagens = ref<MensagemChat[]>([])
  const regra = ref<RegraCampanha | null>(null)
  const aguardandoLana = ref(false)
  const simulando = ref(false)

  const camposVazios = computed(() =>
    (regra.value?.parametros ?? []).filter((p) => p.required && estaVazio(p.value)).map((p) => p.key),
  )
  const ocupado = computed(() => aguardandoLana.value || simulando.value)
  const podeSimular = computed(() => regra.value !== null && camposVazios.value.length === 0 && !ocupado.value)

  function adicionar(papel: PapelMensagem, texto: string, extras: Partial<MensagemChat> = {}): void {
    mensagens.value.push({ id: mensagens.value.length + 1, papel, texto, ...extras })
  }

  async function enviar(texto: string): Promise<void> {
    // Um turno por vez: dois envios no mesmo chat embaralham o histórico do agente.
    if (ocupado.value) return
    adicionar('usuario', texto)
    aguardandoLana.value = true
    try {
      const resposta = await servicoCampanha.conversar(chatId.value, texto, regra.value)
      adicionar('agente', resposta.response)
      if (resposta.regra) regra.value = resposta.regra
    } catch (erro) {
      adicionar('erro', descreverFalha(erro))
    } finally {
      aguardandoLana.value = false
    }
  }

  function atualizarParametro(key: string, valor: ValorParametro): void {
    const parametro = regra.value?.parametros.find((p) => p.key === key)
    if (parametro) parametro.value = valor
  }

  /** Leva o cenário calculado ao painel; a simulação continua sendo decisão do usuário. */
  function aplicarCenario(cenario: CenarioAlternativo): void {
    if (!regra.value) return
    atualizarParametro('pct_acrescimo', cenario.pct_acrescimo)
    atualizarParametro('marcas_alvo', [...cenario.marcas_alvo])
    adicionar('agente', `Coloquei no painel o cenário "${cenario.titulo}". Confira e clique em Simular campanha.`)
  }

  async function simular(): Promise<void> {
    if (!regra.value || !podeSimular.value) return
    simulando.value = true
    try {
      const resultado = await servicoCampanha.simular(chatId.value, regra.value)
      adicionar('resultado', resultado.explicacao, { resultado })
    } catch (erro) {
      adicionar('erro', descreverFalha(erro))
    } finally {
      simulando.value = false
    }
  }

  return {
    chatId, mensagens, regra, aguardandoLana, simulando, ocupado, camposVazios, podeSimular,
    enviar, atualizarParametro, aplicarCenario, simular,
  }
})

export function estaVazio(valor: ValorParametro): boolean {
  if (valor === null || valor === undefined) return true
  if (Array.isArray(valor)) return valor.length === 0
  if (typeof valor === 'object') return !valor.data_inicio || !valor.data_fim
  return Number.isNaN(valor)
}
