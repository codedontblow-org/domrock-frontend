import type { Usuario, PostUsuarioDTO, PutUsuarioDTO, ResumoUsuarios } from '@/types/usuarios';
import type { Page } from '@/types/pagination';

import { api } from './api'

export async function findById(id: number): Promise<Usuario> {
    const response = await api.get<Usuario>(`/api/usuarios/${id}`)
    return response.data
}

export async function create(usuario: PostUsuarioDTO): Promise<Usuario> {
    const response = await api.post<Usuario>('/api/usuarios', usuario)
    return response.data
}

export async function updateById(id: number, usuario: PutUsuarioDTO): Promise<Usuario> {
    const response = await api.put<Usuario>(`/api/usuarios/${id}`, usuario)
    return response.data
}

export async function listAll(page?: number, size?: number, sort?: string[]): Promise<Page<Usuario>> {
    const response = await api.get<Page<Usuario>>('/api/usuarios', {
        params: { page, size, sort },
        // O Spring lê cada critério como um `sort` separado; sem isso o axios manda `sort[]=` e ele ignora.
        paramsSerializer: { indexes: null }
    })
    return response.data
}

export async function desativarById(id: number): Promise<Usuario> {
    const response = await api.delete<Usuario>(`/api/usuarios/${id}`)
    return response.data
}

export async function ativarById(id: number): Promise<Usuario> {
    const response = await api.patch<Usuario>(`/api/usuarios/${id}/reativar`)
    return response.data
}

export async function getResumo(): Promise<ResumoUsuarios> {
    const response = await api.get('/api/usuarios/resumo')
    return response.data
}