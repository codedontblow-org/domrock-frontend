import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { criarServicoCampanhasMock, type DadosSalvarCampanha, type ServicoCampanhas } from '../services/campanhas'
import type { AcaoCampanha, CampanhaDetalhe, CampanhaResumo, StatusCampanha } from '../types'

let servicoCampanhas: ServicoCampanhas = criarServicoCampanhasMock()

/** Troca o serviço de campanhas (usado pelos testes com um serviço fake). */
export function definirServicoCampanhas(servico: ServicoCampanhas): void {
  servicoCampanhas = servico
}

export const useCampanhasStore = defineStore('campanhas', () => {
  const campanhas = ref<CampanhaResumo[]>([])
  const campanhaAtual = ref<CampanhaDetalhe | null>(null)
  const carregando = ref(false)
  const filtroStatus = ref<StatusCampanha | 'TODOS'>('TODOS')

  const campanhsFiltradas = computed(() => {
    if (filtroStatus.value === 'TODOS') return campanhas.value
    return campanhas.value.filter((c) => c.status === filtroStatus.value)
  })

  async function listar(): Promise<void> {
    carregando.value = true
    try {
      campanhas.value = await servicoCampanhas.listar()
    } finally {
      carregando.value = false
    }
  }

  async function obter(id: number): Promise<void> {
    carregando.value = true
    try {
      campanhaAtual.value = await servicoCampanhas.obter(id)
    } finally {
      carregando.value = false
    }
  }

  async function salvar(
    chatId: string,
    nome: string,
    regraId: string,
    dadosExtras?: DadosSalvarCampanha,
  ): Promise<CampanhaResumo> {
    const nova = await servicoCampanhas.salvar(chatId, nome, regraId, dadosExtras)
    campanhas.value = [nova, ...campanhas.value]
    return nova
  }

  async function executarAcao(
    id: number,
    acao: AcaoCampanha,
    justificativa?: string,
  ): Promise<void> {
    const atualizada = await servicoCampanhas.executarAcao(id, acao, justificativa)
    const idx = campanhas.value.findIndex((c) => c.id === id)
    if (idx !== -1) campanhas.value[idx] = atualizada
    if (campanhaAtual.value?.id === id) {
      campanhaAtual.value = { ...campanhaAtual.value, ...atualizada }
    }
  }

  return {
    campanhas,
    campanhaAtual,
    carregando,
    filtroStatus,
    campanhsFiltradas,
    listar,
    obter,
    salvar,
    executarAcao,
  }
})
