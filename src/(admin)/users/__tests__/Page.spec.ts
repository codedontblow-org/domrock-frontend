import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  enableAutoUnmount,
  flushPromises,
  mount,
  type DOMWrapper,
  type VueWrapper,
} from '@vue/test-utils'
import { create, desativarById, getResumo, listAll } from '@/services/usuarios'
import type { Usuario } from '@/types/usuarios'
import Page from '../Page.vue'
import {
  entrarComo,
  erroDoBackend,
  erroSemResposta,
  paginaDe,
  resumoDe,
  usuarioFalso,
} from './fakes'

vi.mock('@/services/usuarios')
// auth.ts importa o router, que importa todas as telas.
vi.mock('@/router/index', () => ({ router: { push: vi.fn() } }))

enableAutoUnmount(afterEach)

const ana = usuarioFalso({ nome: 'Ana Paula Reis', perfil: 'ADMIN' })
const beatriz = usuarioFalso({ nome: 'Beatriz Lima' })
const bruno = usuarioFalso({ nome: 'Bruno Teixeira', ativo: false })

function backendCom(usuarios: Usuario[], totalPages = 1) {
  vi.mocked(listAll).mockResolvedValue(paginaDe(usuarios, totalPages))
  vi.mocked(getResumo).mockResolvedValue(resumoDe(usuarios))
}

// noDocumento: eventos sobem até a window, como no navegador (o Esc do modal escuta a window).
async function abrirTela(noDocumento = false): Promise<VueWrapper> {
  const tela = mount(Page, noDocumento ? { attachTo: document.body } : {})
  await flushPromises()
  return tela
}

function linhaDe(tela: VueWrapper, nome: string): DOMWrapper<Element> {
  const linha = tela.findAll('tbody tr').find((tr) => tr.text().includes(nome))
  if (!linha)
    throw new Error(`linha de "${nome}" não existe; a tabela tem: ${tela.find('tbody').text()}`)
  return linha
}

function botao(
  raiz: VueWrapper | DOMWrapper<Element>,
  texto: string,
): DOMWrapper<HTMLButtonElement> {
  const achado = raiz
    .findAll('button')
    .find((b) => b.text() === texto || b.attributes('aria-label') === texto)
  if (!achado)
    throw new Error(
      `botão "${texto}" não existe; há: ${raiz
        .findAll('button')
        .map((b) => b.text())
        .join(', ')}`,
    )
  return achado
}

async function preencherNovoUsuario(tela: VueWrapper) {
  const modal = tela.find('[role="dialog"]')
  await modal.find('input[type="text"]').setValue('Marina Costa')
  await modal.find('input[type="email"]').setValue('marina@camplana.com.br')
  await modal.find('[role="combobox"]').trigger('click')
  await modal
    .findAll('[role="option"]')
    .find((o) => o.text().startsWith('Supervisor'))
    ?.trigger('click')
  await modal.find('input[type="password"]').setValue('senha-forte')
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  entrarComo(ana)
  backendCom([ana, beatriz, bruno])
})

describe('lista de usuários', () => {
  it('pede ao backend os ativos primeiro e por nome, para a ordem valer entre as páginas', async () => {
    await abrirTela()

    expect(listAll).toHaveBeenCalledWith(0, 10, ['ativo,desc', 'nome,asc'])
  })

  // Regressão do PR #6: a tela reordenava só os 10 itens da página e a página 2 voltava a ter ativo.
  it('mostra os usuários na ordem que o backend mandou, sem reordenar', async () => {
    backendCom([beatriz, bruno, ana])

    const tela = await abrirTela()

    const nomes = tela.findAll('tbody tr').map((tr) => tr.find('td').text())
    expect(nomes).toEqual(['Beatriz Lima', 'Bruno Teixeira', 'Ana Paula Reis (você)'])
  })

  it('mostra o resumo da lista com o plural certo', async () => {
    const tela = await abrirTela()

    expect(tela.text()).toContain('Visualizando 3 usuários · 2 ativos e 1 desativado')
  })

  it('o desativado fica em cinza e com o botão de reativar', async () => {
    const tela = await abrirTela()

    expect(linhaDe(tela, 'Bruno').classes()).toContain('text-gray-txt3-dark')
    expect(botao(linhaDe(tela, 'Bruno'), 'Reativar Bruno Teixeira').exists()).toBe(true)
  })

  it('a própria conta aparece como "você", sem poder se desativar, e explica por quê', async () => {
    const tela = await abrirTela()
    const linha = linhaDe(tela, 'Ana')

    expect(linha.text()).toContain('(você)')
    expect(
      botao(linha, 'Você não pode desativar a própria conta').attributes('disabled'),
    ).toBeDefined()
    expect(linha.find('[role="tooltip"]').text()).toBe('Você não pode desativar a própria conta')
  })

  it('se a lista falha, avisa na tabela e carrega de novo ao tentar outra vez', async () => {
    vi.mocked(listAll).mockRejectedValueOnce(erroSemResposta())
    const tela = await abrirTela()
    expect(tela.text()).toContain('Não foi possível carregar os usuários')
    expect(tela.text()).not.toContain('Visualizando')

    await botao(tela, 'Tentar de novo').trigger('click')
    await flushPromises()

    expect(linhaDe(tela, 'Beatriz').exists()).toBe(true)
  })

  it('a próxima página pede a página seguinte ao backend', async () => {
    backendCom([ana, beatriz, bruno], 2)
    const tela = await abrirTela()

    await botao(tela, 'Próxima').trigger('click')

    expect(listAll).toHaveBeenLastCalledWith(1, 10, ['ativo,desc', 'nome,asc'])
  })
})

describe('cadastro de usuário', () => {
  it('Salvar começa desabilitado e, com tudo preenchido, cadastra, fecha o modal e recarrega a lista', async () => {
    const tela = await abrirTela()
    await botao(tela, 'Adicionar usuário').trigger('click')
    expect(botao(tela.find('[role="dialog"]'), 'Salvar').attributes('disabled')).toBeDefined()

    await preencherNovoUsuario(tela)
    await tela.find('form').trigger('submit')
    await flushPromises()

    expect(create).toHaveBeenCalledWith({
      nome: 'Marina Costa',
      email: 'marina@camplana.com.br',
      perfil: 'SUPERVISOR',
      senha: 'senha-forte',
    })
    expect(tela.find('[role="dialog"]').exists()).toBe(false)
    expect(listAll).toHaveBeenCalledTimes(2)
  })

  it('e-mail repetido mantém o modal aberto com o erro sob o e-mail', async () => {
    vi.mocked(create).mockRejectedValue(erroDoBackend(409, 'Já existe um usuário com este e-mail'))
    const tela = await abrirTela()
    await botao(tela, 'Adicionar usuário').trigger('click')

    await preencherNovoUsuario(tela)
    await tela.find('form').trigger('submit')
    await flushPromises()

    const email = tela.find('input[type="email"]')
    expect(email.attributes('aria-invalid')).toBe('true')
    expect(tela.find(`#${email.attributes('aria-describedby')}`).text()).toBe(
      'Já existe um usuário com este e-mail',
    )
  })

  it('Esc fecha o modal', async () => {
    const tela = await abrirTela()
    await botao(tela, 'Adicionar usuário').trigger('click')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(tela.find('[role="dialog"]').exists()).toBe(false)
  })

  it('com a lista de perfis aberta, Esc fecha só a lista e o modal continua', async () => {
    const tela = await abrirTela(true)
    await botao(tela, 'Adicionar usuário').trigger('click')
    const perfil = tela.find('[role="combobox"]')
    await perfil.trigger('click')

    await perfil.trigger('keydown', { key: 'Escape' })

    expect(tela.find('[role="listbox"]').exists()).toBe(false)
    expect(tela.find('[role="dialog"]').exists()).toBe(true)
  })
})

describe('desativar usuário', () => {
  it('a falha aparece dentro do modal, que continua aberto para tentar de novo', async () => {
    vi.mocked(desativarById).mockRejectedValue(erroSemResposta())
    const alerta = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const tela = await abrirTela()

    await botao(linhaDe(tela, 'Beatriz'), 'Desativar Beatriz Lima').trigger('click')
    const modal = tela.find('[role="dialog"]')
    expect(modal.find('h3').text()).toBe('Desativar Beatriz Lima?')
    await botao(modal, 'Desativar').trigger('click')
    await flushPromises()

    expect(modal.find('[role="alert"]').text()).toContain('Não foi possível desativar agora')
    expect(botao(modal, 'Tentar de novo').exists()).toBe(true)
    expect(alerta).not.toHaveBeenCalled()
  })
})
