import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import Sidebar from '@/components/Sidebar.vue'
import { router } from '@/router/index'

enableAutoUnmount(afterEach)

/** Tela larga: a barra lateral começa aberta e não escuta mudança de largura nos testes. */
class FakeConsultaDeMidia {
  readonly matches = false
  readonly media: string
  constructor(media: string) {
    this.media = media
  }
  addEventListener(): void {}
  removeEventListener(): void {}
}

function entrarComo(perfil: string): void {
  localStorage.setItem('token', 'token-falso')
  localStorage.setItem('perfil', perfil)
  localStorage.setItem('usuario', JSON.stringify({ id: 2, nome: 'Sérgio', email: 'sergio@camplana.com.br' }))
}

beforeEach(() => {
  window.matchMedia = ((media: string) => new FakeConsultaDeMidia(media)) as unknown as typeof window.matchMedia
})

afterEach(() => localStorage.clear())

async function itensDoMenu(): Promise<string[]> {
  const barra = mount(Sidebar, { global: { plugins: [router] } })
  await flushPromises()
  return barra.findAll('.menu-label').map((item) => item.text())
}

describe('acesso à importação: só o Supervisor (card A6-79)', () => {
  it('o menu do Supervisor tem "Importar base" antes de "Configurações"', async () => {
    entrarComo('SUPERVISOR')

    const itens = await itensDoMenu()

    expect(itens.slice(-2)).toEqual(['Importar base', 'Configurações'])
  })

  it('o menu da Gerente não mostra "Importar base"', async () => {
    entrarComo('GERENTE')

    expect(await itensDoMenu()).not.toContain('Importar base')
  })

  it('a Gerente que digita /importar volta para o chat; o Supervisor entra', async () => {
    entrarComo('GERENTE')
    await router.push('/importar/3')
    expect(router.currentRoute.value.name).toBe('chat')

    entrarComo('SUPERVISOR')
    await router.push('/importar/3')
    expect(router.currentRoute.value.name).toBe('importar-relatorio')
  })
})
