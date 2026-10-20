import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, isAxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { api } from '../api'
import { encerrarSessao } from '../auth'
import { descreverFalha } from '@/(user)/chat/services/campanha'

// auth.ts importa o router (e com ele as telas); aqui só interessa se a sessão foi encerrada.
vi.mock('../auth', () => ({ encerrarSessao: vi.fn() }))

/** Backend fora do ar: o axios falha sem resposta, como numa queda de rede ou timeout. */
const adaptadorSemResposta: AxiosAdapter = (config) =>
  Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config as InternalAxiosRequestConfig))

/** Backend no ar respondendo com o status pedido. */
function adaptadorComStatus(status: number): AxiosAdapter {
  return (config) => {
    const pedido = config as InternalAxiosRequestConfig
    const resposta = { status, statusText: '', headers: {}, config: pedido, data: {} }
    return Promise.reject(new AxiosError('Falhou', AxiosError.ERR_BAD_REQUEST, pedido, null, resposta))
  }
}

async function falhaDe(promessa: Promise<unknown>): Promise<unknown> {
  return promessa.then(
    () => { throw new Error('esperava falha, a requisição deu certo') },
    (erro: unknown) => erro,
  )
}

afterEach(() => vi.mocked(encerrarSessao).mockClear())

describe('interceptor de resposta da API', () => {
  // Regressão: lia error.response.status sem resposta e trocava o erro do axios por um TypeError,
  // então a tela mostrava "Algo saiu do esperado" no lugar de "Sem resposta do servidor".
  it('sem resposta do servidor, repassa o erro do axios', async () => {
    const erro = await falhaDe(api.get('/api/chat', { adapter: adaptadorSemResposta }))

    expect(isAxiosError(erro)).toBe(true)
    expect(descreverFalha(erro)).toBe('Sem resposta do servidor. Confira se o backend e a Lana estão no ar.')
    expect(encerrarSessao).not.toHaveBeenCalled()
  })

  it('401 fora do login encerra a sessão', async () => {
    await falhaDe(api.post('/api/chat', {}, { adapter: adaptadorComStatus(401) }))

    expect(encerrarSessao).toHaveBeenCalledOnce()
  })

  it('401 no próprio login (senha errada) não encerra a sessão', async () => {
    await falhaDe(api.post('api/auth/login', {}, { adapter: adaptadorComStatus(401) }))

    expect(encerrarSessao).not.toHaveBeenCalled()
  })
})
