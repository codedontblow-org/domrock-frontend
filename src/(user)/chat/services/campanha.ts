import { isAxiosError, type AxiosInstance } from 'axios'
import type { FalhaSimulacao, RegraCampanha, RespostaChat, ResultadoSimulacao } from '../types'

/** Chamadas do chat ao Spring (que repassa à Lana). Recebe o cliente HTTP para ser testável. */
export function criarServicoCampanha(http: AxiosInstance) {
  return {
    /** `regra` leva o painel como está (com edições), para a Lana partir dele. */
    async conversar(chatId: string, mensagem: string, regra: RegraCampanha | null): Promise<RespostaChat> {
      const { data } = await http.post<RespostaChat>('/api/chat', { chat_id: chatId, message: mensagem, regra })
      return data
    },

    async simular(chatId: string, regra: RegraCampanha): Promise<ResultadoSimulacao> {
      const { data } = await http.post<ResultadoSimulacao>('/api/simulacoes', { chat_id: chatId, regra })
      return data
    },
  }
}

export type ServicoCampanha = ReturnType<typeof criarServicoCampanha>

/** Texto de erro para o usuário: o que falhou e, quando houver, o que corrigir. */
export function descreverFalha(erro: unknown): string {
  if (!isAxiosError(erro)) return 'Algo saiu do esperado. Tente de novo.'
  if (!erro.response) return 'Sem resposta do servidor. Confira se o backend e a Lana estão no ar.'
  const falha = erro.response.data as Partial<FalhaSimulacao> & { message?: string }
  if (falha.erros?.length) return `Revise a campanha: ${falha.erros.join('; ')}`
  return falha.mensagem ?? falha.message ?? `O servidor respondeu ${erro.response.status}.`
}
