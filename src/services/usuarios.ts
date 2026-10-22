import type { Usuario, PostUsuarioDTO, PutUsuarioDTO } from '@/types/usuarios';
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

export async function listAll(page?: number, size?: number): Promise<Page<Usuario>> {
    const response = await api.get<Page<Usuario>>('/api/usuarios', {
        params: {page,size}
    })
    return response.data
}

export async function desativarById(id: number): Promise<Usuario> {
    const response = await api.delete<Usuario>(`/api/usuarios/${id}`)
    return response.data
}

export async function ativarById(id: number): Promise<Usuario> {
    const response = await api.patch<Usuario>(`/api/usuarios/${id}/ativar`)
    return response.data
}