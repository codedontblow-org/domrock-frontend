export type Perfil = 'GERENTE' | 'SUPERVISOR' | 'ADMIN';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
}

export interface PostUsuarioDTO {
    nome: string;
    email: string;
    senha: string;
    perfil: Perfil;
}

export interface PutUsuarioDTO{
    nome: string;
    email: string;
    perfil: Perfil;
}
