import { AxiosError, AxiosHeaders } from 'axios'
import type { Page } from '@/types/pagination'
import type { ResumoUsuarios, Usuario } from '@/types/usuarios'

let proximoId = 100

/** Usuário ativo de Gerente, com id novo a cada chamada. Ex.: usuarioFalso({ nome: 'Bruno', ativo: false }) */
export function usuarioFalso(sobrescrever: Partial<Usuario> = {}): Usuario {
  proximoId += 1
  return {
    id: proximoId,
    nome: 'Beatriz Lima',
    email: `usuario${proximoId}@camplana.com.br`,
    perfil: 'GERENTE',
    ativo: true,
    ...sobrescrever,
  }
}

/** Página do Spring Data com os usuários na ordem dada (a ordem é a do backend). */
export function paginaDe(usuarios: Usuario[], totalPages = 1, numero = 0): Page<Usuario> {
  const sort = { empty: false, sorted: true, unsorted: false }
  return {
    content: usuarios,
    empty: usuarios.length === 0,
    first: numero === 0,
    last: numero === totalPages - 1,
    number: numero,
    numberOfElements: usuarios.length,
    size: 10,
    sort,
    totalElements: usuarios.length,
    totalPages,
    pageable: {
      offset: numero * 10,
      pageNumber: numero,
      pageSize: 10,
      paged: true,
      unpaged: false,
      sort,
    },
  }
}

export function resumoDe(usuarios: Usuario[]): ResumoUsuarios {
  const ativos = usuarios.filter((u) => u.ativo).length
  return { total: usuarios.length, ativos, desativados: usuarios.length - ativos }
}

/** Erro do axios como o backend devolve: status e { message } no corpo. */
export function erroDoBackend(status: number, message?: string): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const data = message === undefined ? {} : { status, message }
  return new AxiosError('falhou', 'ERR_BAD_RESPONSE', config, null, {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  })
}

/** Backend fora do ar: o axios falha sem resposta. */
export function erroSemResposta(): AxiosError {
  return new AxiosError('Network Error', AxiosError.ERR_NETWORK, { headers: new AxiosHeaders() })
}

/** Grava a sessão como o login faz, para a tela reconhecer a própria linha. */
export function entrarComo(usuario: Usuario) {
  localStorage.setItem(
    'usuario',
    JSON.stringify({ id: usuario.id, nome: usuario.nome, email: usuario.email }),
  )
}
