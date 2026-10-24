import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { api } from '../api'
import { listAll } from '../usuarios'

// auth.ts importa o router (e com ele as telas); aqui só interessa a URL montada.
vi.mock('../auth', () => ({ encerrarSessao: vi.fn() }))

const adaptadorOriginal = api.defaults.adapter

/** Backend falso que guarda a URL de cada requisição e responde uma página vazia. */
function backendQueGuardaUrls(urls: string[]): AxiosAdapter {
  return (config) => {
    const pedido = config as InternalAxiosRequestConfig
    urls.push(api.getUri(pedido))
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {},
      config: pedido,
      data: { content: [] },
    })
  }
}

afterEach(() => {
  api.defaults.adapter = adaptadorOriginal
})

describe('listAll', () => {
  // Regressão do PR #6: sem paramsSerializer o axios mandava sort[]=... e o Spring ignorava a ordem.
  it('manda cada critério de ordem como um sort separado, no formato do Spring', async () => {
    const urls: string[] = []
    api.defaults.adapter = backendQueGuardaUrls(urls)

    await listAll(0, 10, ['ativo,desc', 'nome,asc'])

    expect(urls[0]).toMatch(/\/api\/usuarios\?page=0&size=10&sort=ativo,desc&sort=nome,asc$/)
  })
})
