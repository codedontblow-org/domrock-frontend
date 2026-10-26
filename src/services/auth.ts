import { api } from './api'
import { router } from '@/router/index'

export interface LoginResponse {
    token: string
    perfil: string
    validade: string
    usuario: {
        id: number
        nome: string
        email: string
    }
}

export type UsuarioLogado = LoginResponse['usuario']

/** Usuário salvo no login, ou null sem sessão. Ex.: usuarioLogado()?.nome -> "Gabriela" */
export function usuarioLogado(): UsuarioLogado | null {
    return JSON.parse(localStorage.getItem('usuario') ?? 'null')
}

/** Perfil salvo no login decide o que a tela mostra. Ex.: ehSupervisor() -> true para o Sérgio */
export function ehSupervisor(): boolean {
    return localStorage.getItem('perfil') === 'SUPERVISOR'
}

export async function login(
    email: string,
    senha: string
): Promise<LoginResponse> {
    const response = await api.post<LoginResponse> (
        'api/auth/login',
        { email, senha },
    )

    const data = response.data

    localStorage.setItem("token", data.token)
    localStorage.setItem("usuario", JSON.stringify(data.usuario))
    localStorage.setItem("perfil", data.perfil)

    return data
}

export function encerrarSessao() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('perfil')

    router.push('/login')
}