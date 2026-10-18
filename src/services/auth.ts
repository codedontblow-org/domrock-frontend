import { api } from './api'

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
}