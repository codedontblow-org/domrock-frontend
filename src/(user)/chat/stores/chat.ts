import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'
import { criarServicoCampanha, descreverFalha, type ServicoCampanha } from '../services/campanha'
import {
  ETAPAS_DE_ENVIO,
  type CenarioAlternativo, type EtapaAprovacao, type MensagemChat, type PapelMensagem, type RegraCampanha,
  type ValorParametro,
} from '../types'

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
  /** Etapa do job que o backend informa ("Na fila", "Simulando"); null fora da simulação. */
  const etapaSimulacao = ref<string | null>(null)
  /** Última simulação concluída e a regra que ela usou (JSON), para saber se o painel mudou depois. */
  const simulacaoId = ref<number | null>(null)
  const regraSimulada = ref<string | null>(null)
  const cabeNoOrcamento = ref(false)
  /** Conversa reaberta pelo painel de aprovação: só para consulta, não simula nem envia. */
  const somenteLeitura = ref(false)
  /** Campanha salva desta conversa: se o submeter falhar, a nova tentativa não salva de novo. */
  const campanhaId = ref<number | null>(null)
  const enviandoAprovacao = ref(false)
  const enviadaParaAprovacao = ref(false)

  const camposVazios = computed(() =>
    (regra.value?.parametros ?? []).filter((p) => p.required && estaVazio(p.value)).map((p) => p.key),
  )
  const ocupado = computed(() =>
    aguardandoLana.value || simulando.value || enviandoAprovacao.value || somenteLeitura.value,
  )
  const podeSimular = computed(() => regra.value !== null && camposVazios.value.length === 0 && !ocupado.value)
  const etapaAprovacao = computed<EtapaAprovacao>(() => {
    if (somenteLeitura.value) return 'somente_leitura'
    if (enviadaParaAprovacao.value) return 'enviada'
    if (enviandoAprovacao.value) return 'enviando'
    if (simulacaoId.value === null) return 'sem_simulacao'
    if (JSON.stringify(regra.value) !== regraSimulada.value) return 'desatualizada'
    return cabeNoOrcamento.value ? 'pronta' : 'fora_do_orcamento'
  })

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
      adicionar('agente', resposta.response, { events: resposta.events })
      if (resposta.regra) regra.value = resposta.regra
    } catch (erro) {
      adicionar('erro', descreverFalha(erro))
    } finally {
      aguardandoLana.value = false
    }
  }

  function atualizarParametro(key: string, valor: ValorParametro): void {
    if (somenteLeitura.value) return
    const parametro = regra.value?.parametros.find((p) => p.key === key)
    if (parametro) parametro.value = valor
  }

  /** Leva o cenário calculado ao painel; a simulação continua sendo decisão do usuário. */
  function aplicarCenario(cenario: CenarioAlternativo): void {
    if (!regra.value || somenteLeitura.value) return
    atualizarParametro('pct_acrescimo', cenario.pct_acrescimo)
    atualizarParametro('marcas_alvo', [...cenario.marcas_alvo])
    adicionar('agente', `Coloquei no painel o cenário "${cenario.titulo}". Confira e clique em Simular campanha.`)
  }

  async function simular(): Promise<void> {
    if (!regra.value || !podeSimular.value) return
    simulando.value = true
    const regraEnviada = JSON.stringify(regra.value)
    try {
      const { id, resultado } = await servicoCampanha.simular(chatId.value, regra.value, (etapa) => {
        etapaSimulacao.value = etapa
      })
      simulacaoId.value = id
      regraSimulada.value = regraEnviada
      cabeNoOrcamento.value = resultado.orcamento.cabe_no_orcamento
      adicionar('resultado', resultado.explicacao, { resultado })
    } catch (erro) {
      adicionar('erro', descreverFalha(erro))
    } finally {
      simulando.value = false
      etapaSimulacao.value = null
    }
  }

  /**
   * Salva a conversa como campanha e a submete: ela passa a aparecer em "Aguardando Aprovação".
   * Fora do orçamento também vai: quem decide é o supervisor (decisão do PO, 26/10).
   */
  async function enviarParaAprovacao(nome: string): Promise<void> {
    if (!ETAPAS_DE_ENVIO.includes(etapaAprovacao.value) || ocupado.value || simulacaoId.value === null || !nome.trim()) {
      return
    }
    enviandoAprovacao.value = true
    try {
      campanhaId.value ??= (await servicoCampanha.salvarCampanha(chatId.value, simulacaoId.value, nome.trim())).id
      await servicoCampanha.submeter(campanhaId.value)
      enviadaParaAprovacao.value = true
      adicionar('agente', `Enviei "${nome.trim()}" para aprovação. Ela aparece em Campanhas, na aba Aguardando Aprovação.`)
    } catch (erro) {
      adicionar('erro', descreverFalha(erro))
    } finally {
      enviandoAprovacao.value = false
    }
  }

  /** Começa uma conversa nova, sem nada da anterior. */
  function novaConversa(): void {
    chatId.value = novoChatId()
    mensagens.value = []
    regra.value = null
    simulacaoId.value = null
    regraSimulada.value = null
    cabeNoOrcamento.value = false
    campanhaId.value = null
    enviadaParaAprovacao.value = false
    somenteLeitura.value = false
  }

  /**
   * Reabre, só para consulta, a conversa que gerou a simulação. O backend não guarda as mensagens
   * do chat: o que volta é o pedido original, a ficha e o resultado que estão na simulação.
   */
  async function abrirSimulacao(id: number): Promise<void> {
    novaConversa()
    somenteLeitura.value = true
    try {
      const simulacao = await servicoCampanha.buscarSimulacao(id)
      chatId.value = simulacao.chat_id
      regra.value = simulacao.ficha
      if (simulacao.ficha.raw_prompt) adicionar('usuario', simulacao.ficha.raw_prompt)
      if (simulacao.resultado) {
        adicionar('resultado', simulacao.resultado.explicacao, { resultado: simulacao.resultado })
      } else if (simulacao.erro) {
        adicionar('erro', simulacao.erro.mensagem)
      }
    } catch (erro) {
      adicionar('erro', descreverFalha(erro))
    }
  }

  return {
    chatId, mensagens, regra, aguardandoLana, simulando, etapaSimulacao, ocupado, camposVazios, podeSimular,
    etapaAprovacao, somenteLeitura, enviar, atualizarParametro, aplicarCenario, simular, enviarParaAprovacao,
    novaConversa, abrirSimulacao,
  }
})

export function estaVazio(valor: ValorParametro): boolean {
  if (valor === null || valor === undefined) return true
  if (Array.isArray(valor)) return valor.length === 0
  if (typeof valor === 'object') return !valor.data_inicio || !valor.data_fim
  return Number.isNaN(valor)
}
