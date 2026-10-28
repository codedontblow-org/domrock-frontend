import { describe, expect, it } from 'vitest'
import { useSeusChats } from '../useSeusChats'
import { FakeServicoCampanhas, resumoBlackFriday } from './fakes'

describe('useSeusChats (Item 7)', () => {
  it('carrega lista com título = nome e data = dd/mm na ordem do backend', async () => {
    const servico = new FakeServicoCampanhas()
    servico.lista = [
      resumoBlackFriday({
        id: 10,
        nome: 'Campanha Dezembro',
        atualizada_em: '2026-12-05T10:00:00Z',
      }),
      resumoBlackFriday({
        id: 12,
        nome: 'Black Friday 2025',
        atualizada_em: '2026-10-21T13:00:12Z',
      }),
    ]

    const { chats, carregar } = useSeusChats(servico)
    await carregar()

    expect(servico.filtrosPedidos).toEqual([undefined])
    expect(chats.value).toHaveLength(2)
    expect(chats.value[0]).toEqual({ id: 10, titulo: 'Campanha Dezembro', data: '05/12' })
    expect(chats.value[1]).toEqual({ id: 12, titulo: 'Black Friday 2025', data: '21/10' })
  })

  it('lista vazia resulta em chats vazio para ocultar a seção', async () => {
    const servico = new FakeServicoCampanhas()
    servico.lista = []

    const { chats, carregar } = useSeusChats(servico)
    await carregar()

    expect(chats.value).toEqual([])
  })

  it('em caso de erro na chamada, mantém chats vazio e não estoura exceção', async () => {
    const servico = new FakeServicoCampanhas()
    servico.falha = new Error('Falha de rede')

    const { chats, carregar } = useSeusChats(servico)
    await carregar()

    expect(chats.value).toEqual([])
  })
})
