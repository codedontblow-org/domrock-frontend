import { isAxiosError } from 'axios'

/** Status HTTP da falha, ou undefined quando não houve resposta (backend fora do ar, timeout). */
export function statusDoErro(erro: unknown): number | undefined {
  return isAxiosError(erro) ? erro.response?.status : undefined
}

/**
 * Mensagem que o backend mandou num erro 4xx, ou null.
 * Num 5xx a mensagem é técnica ("Internal Server Error") e a tela usa o próprio texto.
 * Ex.: 400 { message: 'Você não pode desativar a própria conta' } -> 'Você não pode desativar a própria conta'
 */
export function mensagemDoBackend(erro: unknown): string | null {
  const status = statusDoErro(erro)
  if (!isAxiosError(erro) || status === undefined || status >= 500) return null
  const corpo: unknown = erro.response?.data
  if (typeof corpo !== 'object' || corpo === null || !('message' in corpo)) return null
  return typeof corpo.message === 'string' && corpo.message !== '' ? corpo.message : null
}
