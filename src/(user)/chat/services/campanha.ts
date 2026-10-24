import { isAxiosError, type AxiosInstance } from 'axios'
import type {
  FalhaSimulacao, RegraCampanha, RespostaChat, ResultadoSimulacao, SimulacaoAndamento, SimulacaoCriada,
} from '../types'

/** O contrato 4 combina a consulta do status a cada 2 segundos. */
const INTERVALO_CONSULTA_MS = 2000

/** O job terminou em ERRO; `falha` é o `erro` que o backend gravou (corpo da Lana ou etapa do backend). */
export class SimulacaoTerminouEmErro extends Error {
  readonly falha: FalhaSimulacao

  constructor(falha: FalhaSimulacao) {
    super(falha.mensagem)
    this.falha = falha
  }
}

function esperarDeVerdade(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Chamadas do chat ao Spring (que repassa à Lana). Recebe o cliente HTTP e a espera do polling para
 * ser testável. Ex.: criarServicoCampanha(api).simular(chatId, regra, (etapa) => mostrar(etapa))
 */
export function criarServicoCampanha(http: AxiosInstance, esperar: (ms: number) => Promise<void> = esperarDeVerdade) {
  /**
   * Sem limite de consultas: o backend garante que nenhum job fica RODANDO para sempre (vira ERRO
   * no read-timeout de 3 min e na subida do servidor, contrato 4).
   */
  async function acompanhar(id: number, aoMudarEtapa: (etapa: string) => void): Promise<ResultadoSimulacao> {
    for (;;) {
      await esperar(INTERVALO_CONSULTA_MS)
      const { data } = await http.get<SimulacaoAndamento>(`/api/simulacoes/${id}`)
      aoMudarEtapa(data.etapa)
      if (data.status === 'CONCLUIDA') return data.resultado
      if (data.status === 'ERRO') throw new SimulacaoTerminouEmErro(data.erro)
    }
  }

  return {
    /** `regra` leva o painel como está (com edições), para a Lana partir dele. */
    async conversar(chatId: string, mensagem: string, regra: RegraCampanha | null): Promise<RespostaChat> {
      const { data } = await http.post<RespostaChat>('/api/chat', { chat_id: chatId, message: mensagem, regra })
      return data
    },

    /** Pede o job (202), avisa cada etapa e devolve o resultado quando ele conclui (A6-66). */
    async simular(chatId: string, regra: RegraCampanha, aoMudarEtapa: (etapa: string) => void): Promise<ResultadoSimulacao> {
      const { data } = await http.post<SimulacaoCriada>('/api/simulacoes', { chat_id: chatId, regra })
      aoMudarEtapa(data.etapa)
      return acompanhar(data.id, aoMudarEtapa)
    },
  }
}

export type ServicoCampanha = ReturnType<typeof criarServicoCampanha>

/** Texto da falha que o backend ou a Lana mandou: o que corrigir ou, sem lista, a mensagem. */
function textoDaFalha(falha: Partial<FalhaSimulacao>): string | undefined {
  if (falha.erros?.length) return `Revise a campanha: ${falha.erros.join('; ')}`
  return falha.mensagem
}

/** Texto de erro para o usuário: o que falhou e, quando houver, o que corrigir. */
export function descreverFalha(erro: unknown): string {
  if (erro instanceof SimulacaoTerminouEmErro) return textoDaFalha(erro.falha) ?? 'A simulação falhou.'
  if (!isAxiosError(erro)) return 'Algo saiu do esperado. Tente de novo.'
  if (!erro.response) return 'Sem resposta do servidor. Confira se o backend e a Lana estão no ar.'
  const falha = erro.response.data as Partial<FalhaSimulacao> & { message?: string }
  return textoDaFalha(falha) ?? falha.message ?? `O servidor respondeu ${erro.response.status}.`
}
