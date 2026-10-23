export interface Acrescimos {
  base: string
  vigente: string
  acrescimo: string
  total: string
}

export interface Interferencia {
  id: number | string
  tipo: 'Intercorrência' | 'Campanha'
  descricao: string
}

export interface CampanhaAprovacao {
  id: number | string
  titulo: string
  inicio: string
  fim: string
  percentual: string
  retorno: string
  investimento: string
  cargosEProdutos: string
  sugeridoPor: string
  submetidoEm: string
  status: string
  descricao?: string
  chatId?: string
  acrescimos?: Acrescimos
  marcas?: string[]
  cargos?: string[]
  interferencias?: Interferencia[]
}
