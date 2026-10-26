import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import { descreverFalha } from '../../chat/services/campanha'
import { criarServicoCampanhas, type AcaoSemCorpo, type ServicoCampanhas } from '../../campanha/services/campanhas'
import type { CampanhaDetalhe, CampanhaResumo, StatusCampanha } from '../../campanha/types'

let servicoCampanhas: ServicoCampanhas = criarServicoCampanhas(api)

/** Troca o serviço de campanhas (usado pelos testes com um serviço fake). */
export function definirServicoCampanhas(servico: ServicoCampanhas): void {
  servicoCampanhas = servico
}

/** 'TODOS' = sem filtro: o backend devolve todas, menos as arquivadas (contrato 5.4). */
export type FiltroStatus = StatusCampanha | 'TODOS'

export const useCampanhasStore = defineStore('campanhas', () => {
  const campanhas = ref<CampanhaResumo[]>([])
  const campanhaAtual = ref<CampanhaDetalhe | null>(null)
  const carregando = ref(false)
  const agindo = ref(false)
  const filtroStatus = ref<FiltroStatus>('TODOS')
  /** Falha da última chamada, no texto que o backend mandou (ex.: o 409 de uma transição). */
  const erro = ref<string | null>(null)

  async function carregar(tarefa: () => Promise<void>): Promise<void> {
    carregando.value = true
    erro.value = null
    try {
      await tarefa()
    } catch (falha) {
      erro.value = descreverFalha(falha)
    } finally {
      carregando.value = false
    }
  }

  /** O front só repassa a aba escolhida; quem filtra é o backend (contrato 5.4). */
  async function listar(): Promise<void> {
    const status = filtroStatus.value === 'TODOS' ? undefined : filtroStatus.value
    await carregar(async () => {
      campanhas.value = await servicoCampanhas.minhas(status)
    })
  }

  async function filtrar(status: FiltroStatus): Promise<void> {
    filtroStatus.value = status
    await listar()
  }

  async function obter(id: number): Promise<void> {
    campanhaAtual.value = null
    await carregar(async () => {
      campanhaAtual.value = await servicoCampanhas.abrir(id)
    })
  }

  /** Toda ação devolve a Campanha atualizada (contrato 5.7): ela substitui a da tela. */
  async function aplicar(chamada: () => Promise<CampanhaDetalhe>): Promise<void> {
    agindo.value = true
    erro.value = null
    try {
      campanhaAtual.value = await chamada()
    } catch (falha) {
      erro.value = descreverFalha(falha)
    } finally {
      agindo.value = false
    }
  }

  async function agir(id: number, acao: AcaoSemCorpo): Promise<void> {
    await aplicar(() => servicoCampanhas.agir(id, acao))
  }

  async function renomear(id: number, nome: string): Promise<void> {
    await aplicar(() => servicoCampanhas.renomear(id, nome))
  }

  return {
    campanhas, campanhaAtual, carregando, agindo, filtroStatus, erro,
    listar, filtrar, obter, agir, renomear,
  }
})
