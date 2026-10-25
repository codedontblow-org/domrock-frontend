import { afterEach, describe, expect, it, vi } from 'vitest'
import { usuarioLogado } from '../auth'

// O router importa todas as telas; para ler a sessão ele não é necessário.
vi.mock('@/router/index', () => ({ router: { push: vi.fn() } }))

afterEach(() => localStorage.clear())

describe('usuário da sessão', () => {
  it('devolve o usuário salvo no login', () => {
    localStorage.setItem('usuario', JSON.stringify({ id: 1, nome: 'Gabriela', email: 'gabriela@camplana.com.br' }))

    expect(usuarioLogado()?.nome).toBe('Gabriela')
  })

  it('sem sessão, devolve null', () => {
    expect(usuarioLogado()).toBeNull()
  })
})
