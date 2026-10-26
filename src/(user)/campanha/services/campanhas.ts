import type { AxiosInstance } from 'axios'
import type {
  CampanhaAprovada, CampanhaDetalhe, CampanhaResumo, FilaCampanha, PedidoDecisao, StatusCampanha, VersaoCampanha,
} from '../types'

export function criarServicoCampanhas(http: AxiosInstance) {
  return {
    async fila(): Promise<FilaCampanha[]> {
      const { data } = await http.get<FilaCampanha[]>('/api/campanhas/fila')
      return data
    },

    async minhas(status?: StatusCampanha): Promise<CampanhaResumo[]> {
      const { data } = await http.get<CampanhaResumo[]>('/api/campanhas/minhas', { params: { status } })
      return data
    },

    async aprovadas(): Promise<CampanhaAprovada[]> {
      const { data } = await http.get<CampanhaAprovada[]>('/api/campanhas/aprovadas')
      return data
    },

    async abrir(id: number): Promise<CampanhaDetalhe> {
      const { data } = await http.get<CampanhaDetalhe>(`/api/campanhas/${id}`)
      return data
    },

    async versao(id: number, numero: number): Promise<VersaoCampanha> {
      const { data } = await http.get<VersaoCampanha>(`/api/campanhas/${id}/versoes/${numero}`)
      return data
    },

    async decidir(id: number, pedido: PedidoDecisao): Promise<void> {
      await http.post(`/api/campanhas/${id}/decidir`, pedido)
    },
  }
}

export type ServicoCampanhas = ReturnType<typeof criarServicoCampanhas>
