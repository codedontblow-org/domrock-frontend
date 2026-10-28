import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'
import { criarServicoCampanhas, type ServicoCampanhas } from '../../campanha/services/campanhas'
import type { CampanhaDetalhe, UltimaSimulacao } from '../../campanha/types'
import {
  acharUltimaRegraLana, acharUltimoSimulacaoId, converterHistorico, determinarPermissoesCampanha,
  extrairFichaEEstadoSimulacao, extrairSimulacaoConcluida, extrairStatusHttp, guardarChatId, lerChatIdGuardado,
} from '../reabrir'
import { criarServicoCampanha, descreverFalha, type ServicoCampanha } from '../services/campanha'
import { dataLocal } from '../formatacao'
import {
  ETAPAS_DE_ENVIO,
  type CampanhaSalva, type CenarioAlternativo, type ConversaGravada, type EtapaAprovacao, type MensagemChat,
  type MensagemGravada,
  type PapelMensagem, type RegraCampanha, type ResultadoSimulacao, type ValorParametro,
} from '../types'

let servicoCampanha: ServicoCampanha = criarServicoCampanha(api)
let servicoCampanhas: ServicoCampanhas = criarServicoCampanhas(api)

/** Troca o cliente HTTP da store (usado pelos testes com um serviço fake). */
export function definirServicoCampanha(servico: ServicoCampanha): void {
  servicoCampanha = servico
}

export function definirServicoCampanhas(servico: ServicoCampanhas): void {
  servicoCampanhas = servico
}

function novoChatId(): string {
  return `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const useChatStore = defineStore('chat', () => {
  /** Contador de geração da conversa para evitar corrida de respostas antigas (item B1). */
  const geracao = ref(0)
  const contadorLocal = ref(0)
  /** Data local de início da conversa (evita UTC avançar o dia após 21h). */
  const dataInicio = ref(dataLocal())
  const erroEnvio = ref<string | null>(null)
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
  /** Campanha reprovada que o autor pode voltar para rascunho clicando em "Editar campanha" (item 3). */
  const podeVoltarRascunho = ref(false)
  /** Estado de envio de ação EDITAR para evitar duplo clique (item B4). */
  const editandoCampanha = ref(false)
  /** IDs de simulação com busca de resultado em andamento para estado do botão (item B6). */
  const simulacoesCarregando = ref<number[]>([])
  /** Indica se a conversa atual veio da query ?campanha (item B3). */
  const abertaPelaCampanha = ref(false)
  /** Campanha salva desta conversa: se o submeter falhar, a nova tentativa não salva de novo. */
  const campanha = ref<CampanhaSalva | null>(null)
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

  /** Último resultado de simulação nas mensagens, sem guardar cópia em ref separada. */
  const ultimoResultado = computed<ResultadoSimulacao | null>(() => {
    for (let i = mensagens.value.length - 1; i >= 0; i--) {
      const res = mensagens.value[i]?.resultado
      if (res) return res
    }
    return null
  })

  function adicionar(papel: PapelMensagem, texto: string, extras: Partial<MensagemChat> = {}): void {
    contadorLocal.value++
    const chave = extras.chave ?? `l-${contadorLocal.value}`
    mensagens.value.push({ id: extras.id ?? contadorLocal.value, chave, papel, texto, ...extras })
  }

  /**
   * `mensagens_sistema` traz tudo desde a última mensagem do usuário: numa conversa reaberta, isso inclui
   * o que já está na tela (ex.: a reprovação). Pula pelo id do backend e, na simulação feita ao vivo,
   * pelo `simulacao_id` do card que o front já mostrou.
   */
  function jaEstaNaConversa(sys: MensagemGravada): boolean {
    if (mensagens.value.some((m) => m.chave === `b-${sys.id}`)) return true
    if (sys.tipo !== 'SIMULACAO' || !sys.simulacao_id) return false
    return mensagens.value.some((m) => m.simulacao_id === sys.simulacao_id)
  }

  function adicionarMensagensSistema(novas: MensagemGravada[] = []): void {
    for (const sys of novas) {
      if (jaEstaNaConversa(sys)) continue
      adicionar('sistema', sys.texto, {
        id: sys.id,
        chave: `b-${sys.id}`,
        tipo: sys.tipo,
        simulacao_id: sys.simulacao_id,
        criada_em: sys.criada_em,
      })
    }
  }

  async function enviar(texto: string): Promise<void> {
    // Um turno por vez: dois envios no mesmo chat embaralham o histórico do agente.
    if (ocupado.value) return
    adicionar('usuario', texto)
    if (!campanha.value) guardarChatId(chatId.value)
    const gen = geracao.value
    aguardandoLana.value = true
    try {
      const resposta = await servicoCampanha.conversar(chatId.value, texto, regra.value)
      if (geracao.value !== gen) return
      adicionarMensagensSistema(resposta.mensagens_sistema)
      adicionar('agente', resposta.response, { events: resposta.events })
      if (resposta.regra) regra.value = resposta.regra
    } catch (erro) {
      if (geracao.value !== gen) return
      adicionar('erro', descreverFalha(erro))
    } finally {
      if (geracao.value === gen) aguardandoLana.value = false
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
    const gen = geracao.value
    const regraEnviada = JSON.stringify(regra.value)
    try {
      const { id, resultado } = await servicoCampanha.simular(chatId.value, regra.value, (etapa) => {
        if (geracao.value === gen) etapaSimulacao.value = etapa
      })
      if (geracao.value !== gen) return
      simulacaoId.value = id
      regraSimulada.value = regraEnviada
      // Sem orçamento na ficha (A6-72) não há o que estourar: vai para aprovação sem o aviso.
      cabeNoOrcamento.value = resultado.orcamento?.cabe_no_orcamento ?? true
      adicionar('resultado', resultado.explicacao, { resultado, simulacao_id: id })
      if (!campanha.value) guardarChatId(chatId.value)
    } catch (erro) {
      if (geracao.value !== gen) return
      adicionar('erro', descreverFalha(erro))
    } finally {
      if (geracao.value === gen) {
        simulando.value = false
        etapaSimulacao.value = null
      }
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
    erroEnvio.value = null
    enviandoAprovacao.value = true
    try {
      campanha.value ??= await servicoCampanha.salvarCampanha(chatId.value, simulacaoId.value, nome.trim())
      campanha.value = await servicoCampanha.submeter(campanha.value.id)
      enviadaParaAprovacao.value = true
      adicionar('agente', `Enviei "${nome.trim()}" para aprovação. Ela aparece em Campanhas, na aba Aguardando Aprovação.`)
    } catch (erro) {
      const falha = descreverFalha(erro)
      erroEnvio.value = falha
      adicionar('erro', falha)
    } finally {
      enviandoAprovacao.value = false
    }
  }

  /** Começa uma conversa nova, sem nada da anterior e limpa o valor guardado no localStorage. */
  function novaConversa(): void {
    guardarChatId(null)
    geracao.value++
    aguardandoLana.value = false
    simulando.value = false
    etapaSimulacao.value = null
    enviandoAprovacao.value = false
    editandoCampanha.value = false
    simulacoesCarregando.value = []
    abertaPelaCampanha.value = false
    dataInicio.value = dataLocal()
    erroEnvio.value = null
    chatId.value = novoChatId()
    mensagens.value = []
    regra.value = null
    simulacaoId.value = null
    regraSimulada.value = null
    cabeNoOrcamento.value = false
    campanha.value = null
    enviadaParaAprovacao.value = false
    somenteLeitura.value = false
    podeVoltarRascunho.value = false
  }

  function aplicarCampanhaEHistorico(
    c: CampanhaDetalhe,
    historico: { mensagens: MensagemGravada[] },
  ): void {
    chatId.value = c.chat_id
    campanha.value = c
    mensagens.value = converterHistorico(historico.mensagens, c.ultima_simulacao)
    const perms = determinarPermissoesCampanha(c.acoes)
    somenteLeitura.value = perms.somenteLeitura
    podeVoltarRascunho.value = perms.podeVoltarRascunho
    const estado = extrairFichaEEstadoSimulacao(c, historico.mensagens)
    regra.value = estado.regra
    simulacaoId.value = estado.simulacaoId
    regraSimulada.value = estado.regraSimulada
    cabeNoOrcamento.value = estado.cabeNoOrcamento
  }

  /** Reabre a conversa da campanha (critérios 1, 3 e 4). */
  async function abrirCampanha(id: number): Promise<void> {
    novaConversa()
    abertaPelaCampanha.value = true
    somenteLeitura.value = true
    const gen = geracao.value
    try {
      const c = await servicoCampanhas.abrir(id)
      if (geracao.value !== gen) return
      const historico = await servicoCampanha.buscarMensagens(c.chat_id)
      if (geracao.value !== gen) return
      aplicarCampanhaEHistorico(c, historico)
    } catch (erro) {
      if (geracao.value !== gen) return
      adicionar('erro', descreverFalha(erro))
    }
  }

  /** Autor em REPROVADA clica em "Editar campanha" para voltar a rascunho (item 3). */
  async function editarCampanhaReprovada(): Promise<void> {
    if (!campanha.value || editandoCampanha.value) return
    editandoCampanha.value = true
    const gen = geracao.value
    try {
      const atualizada = await servicoCampanhas.agir(campanha.value.id, 'EDITAR')
      if (geracao.value !== gen) return
      const historico = await servicoCampanha.buscarMensagens(atualizada.chat_id)
      if (geracao.value !== gen) return
      aplicarCampanhaEHistorico(atualizada, historico)
    } catch (erro) {
      if (geracao.value !== gen) return
      adicionar('erro', descreverFalha(erro))
    } finally {
      if (geracao.value === gen) editandoCampanha.value = false
    }
  }

  /** Busca o resultado da simulação pelo clique no botão "Ver resultado" de uma mensagem SIMULACAO. */
  async function carregarResultadoSimulacao(id: number): Promise<void> {
    if (simulacoesCarregando.value.includes(id)) return
    simulacoesCarregando.value.push(id)
    const gen = geracao.value
    try {
      const sim = await servicoCampanha.buscarSimulacao(id)
      if (geracao.value !== gen) return
      if (sim.resultado) {
        const msg = mensagens.value.find((m) => m.simulacao_id === id)
        if (msg) msg.resultado = sim.resultado
      }
    } catch (erro) {
      if (geracao.value !== gen) return
      adicionar('erro', descreverFalha(erro))
    } finally {
      simulacoesCarregando.value = simulacoesCarregando.value.filter((sId) => sId !== id)
    }
  }

  async function carregarUltimaSimulacaoSeHouver(id: number | null): Promise<UltimaSimulacao | null> {
    if (id === null) return null
    const sim = await servicoCampanha.buscarSimulacao(id)
    const restaurada = extrairSimulacaoConcluida(sim)
    if (!restaurada) return null
    regra.value = restaurada.regra
    simulacaoId.value = restaurada.simulacaoId
    regraSimulada.value = restaurada.regraSimulada
    cabeNoOrcamento.value = restaurada.cabeNoOrcamento
    return restaurada.ultimaSimulacao
  }

  async function restaurarSimulacaoOuFicha(historico: MensagemGravada[]): Promise<void> {
    const ultimoId = acharUltimoSimulacaoId(historico)
    const ultimaSim = await carregarUltimaSimulacaoSeHouver(ultimoId)
    if (simulacaoId.value === null) {
      regra.value = acharUltimaRegraLana(historico)
    }
    mensagens.value = converterHistorico(historico, ultimaSim)
  }

  function tratarErroRestauracao(erro: unknown): void {
    const status = extrairStatusHttp(erro)
    if (status === 404 || status === 403) {
      novaConversa()
      return
    }
    adicionar('erro', descreverFalha(erro))
  }

  /**
   * Conversa do F5 que já virou campanha. Não passa por `abrirCampanha`: ela começa com `novaConversa()`,
   * que apaga o chat_id guardado, e a URL não tem `?campanha`, então o próximo F5 abriria o chat vazio.
   */
  async function restaurarConversaGravada(historico: ConversaGravada, gen: number): Promise<void> {
    if (historico.campanha_id) {
      const c = await servicoCampanhas.abrir(historico.campanha_id)
      if (geracao.value === gen) aplicarCampanhaEHistorico(c, historico)
      return
    }
    chatId.value = historico.chat_id
    somenteLeitura.value = false
    podeVoltarRascunho.value = false
    campanha.value = null
    await restaurarSimulacaoOuFicha(historico.mensagens)
  }

  /** Restaura a conversa após F5 em /chat sem ?campanha (item 6). */
  async function restaurarSessaoSeVazio(): Promise<void> {
    if (mensagens.value.length > 0) return
    const guardado = lerChatIdGuardado()
    if (!guardado) return
    const gen = geracao.value
    try {
      const historico = await servicoCampanha.buscarMensagens(guardado)
      if (geracao.value !== gen) return
      await restaurarConversaGravada(historico, gen)
    } catch (erro) {
      if (geracao.value !== gen) return
      tratarErroRestauracao(erro)
    }
  }

  return {
    geracao, dataInicio, erroEnvio, chatId, mensagens, regra, aguardandoLana, simulando, etapaSimulacao,
    ocupado, camposVazios, podeSimular, etapaAprovacao, somenteLeitura, podeVoltarRascunho, editandoCampanha,
    simulacoesCarregando, abertaPelaCampanha, campanha, ultimoResultado, simulacaoId, regraSimulada, cabeNoOrcamento,
    enviar, atualizarParametro, aplicarCenario, simular, enviarParaAprovacao,
    novaConversa, abrirCampanha, restaurarSessaoSeVazio, carregarResultadoSimulacao, editarCampanhaReprovada,
  }
})

export function estaVazio(valor: ValorParametro): boolean {
  if (valor === null || valor === undefined) return true
  if (Array.isArray(valor)) return valor.length === 0
  if (typeof valor === 'object') return !valor.data_inicio || !valor.data_fim
  return Number.isNaN(valor)
}
