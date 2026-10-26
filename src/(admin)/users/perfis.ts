import type { Perfil } from '@/types/usuarios'

export interface OpcaoPerfil {
  valor: Perfil
  rotulo: string
  descricao: string
}

// Rótulos curtos, como no card A6-63; o protótipo usa "Gerente de Vendas", mas a coluna Perfil
// tem 200px e o resto do front já fala só "Gerente" e "Supervisor".
export const PERFIS: OpcaoPerfil[] = [
  { valor: 'GERENTE', rotulo: 'Gerente', descricao: 'Cria e simula campanhas no chat' },
  {
    valor: 'SUPERVISOR',
    rotulo: 'Supervisor',
    descricao: 'Aprova campanhas e importa a base do mês',
  },
  { valor: 'ADMIN', rotulo: 'Administrador', descricao: 'Gerencia quem tem acesso ao Camplana' },
]

/** Ex.: rotuloDoPerfil('ADMIN') -> 'Administrador' */
export function rotuloDoPerfil(perfil: Perfil): string {
  return PERFIS.find((p) => p.valor === perfil)?.rotulo ?? perfil
}
