export interface MenuItem {
  id: string
  label: string
  icon: string
  rota?: string
}

export interface Chat {
  id: number
  titulo: string
  data: string
}

export interface User {
  nome: string
  cargo: string
}