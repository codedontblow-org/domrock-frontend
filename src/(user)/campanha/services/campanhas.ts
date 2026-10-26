import type { AxiosInstance } from 'axios'
import { acompanharSimulacao } from '../../chat/services/campanha'
import type { SimulacaoConcluida, SimulacaoCriada } from '../../chat/types'
import type {
  AcaoCampanha, CampanhaAprovada, CampanhaDetalhe, CampanhaResumo, FilaCampanha, PedidoDecisao, StatusCampanha,
  VersaoCampanha,
} from '../types'

/** Ações do autor que são um POST sem corpo (contrato 5.7); RENOMEAR é o PUT com o nome. */
export type AcaoSemCorpo = Exclude<AcaoCampanha, 'RENOMEAR'>

const ROTA_DA_ACAO: Record<AcaoSemCorpo, string> = {
  SUBMETER: 'submeter',
  EDITAR: 'editar',
  ARQUIVAR: 'arquivar',
}

export function criarServicoCampanhas(http: AxiosInstance, esperar?: (ms: number) => Promise<void>) {
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

    /** Ex.: agir(12, 'EDITAR') faz POST /api/campanhas/12/editar e devolve a Campanha atualizada (5.7). */
    async agir(id: number, acao: AcaoSemCorpo): Promise<CampanhaDetalhe> {
      const { data } = await http.post<CampanhaDetalhe>(`/api/campanhas/${id}/${ROTA_DA_ACAO[acao]}`)
      return data
    },

    /** Só em RASCUNHO (contrato 5.7). */
    async renomear(id: number, nome: string): Promise<CampanhaDetalhe> {
      const { data } = await http.put<CampanhaDetalhe>(`/api/campanhas/${id}`, { nome })
      return data
    },

    async versao(id: number, numero: number): Promise<VersaoCampanha> {
      const { data } = await http.get<VersaoCampanha>(`/api/campanhas/${id}/versoes/${numero}`)
      return data
    },

    async decidir(id: number, pedido: PedidoDecisao): Promise<void> {
      await http.post(`/api/campanhas/${id}/decidir`, pedido)
    },

    /** Re-simula a ficha congelada com a % vigente de hoje (contrato 5.9) e espera o job (4.2) concluir. */
    async resimular(id: number, numero: number, aoMudarEtapa: (etapa: string) => void): Promise<SimulacaoConcluida> {
      const { data } = await http.post<SimulacaoCriada>(`/api/campanhas/${id}/versoes/${numero}/resimular`)
      aoMudarEtapa(data.etapa)
      return acompanharSimulacao(http, data.id, aoMudarEtapa, esperar)
    },
  }
}

export type ServicoCampanhas = ReturnType<typeof criarServicoCampanhas>
