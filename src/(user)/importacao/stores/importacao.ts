import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'
import { separarPorMes } from '../planilhas'
import { criarServicoImportacao, descreverFalhaDoEnvio, type ServicoImportacao } from '../services/importacao'
import type { EnvioImportacao, JobImportacao, SituacaoJob } from '../types'

/** NA_FILA espera o mês anterior; NAO_ENVIADO quando a fila parou antes de mandar o mês. */
export type SituacaoDoMes = 'NA_FILA' | 'NAO_ENVIADO' | SituacaoJob

export interface PlanilhaEnviada {
  nome: string
  tamanho: number
}

/** Um mês da fila: o lote que vira um job no backend e o que se sabe dele. */
export interface MesDaFila {
  /** null quando a tela retoma um job que outra aba enviou e o backend ainda não leu o mês. */
  competencia: string | null
  arquivos: PlanilhaEnviada[]
  situacao: SituacaoDoMes
  jobId: number | null
}

let servico: ServicoImportacao = criarServicoImportacao(api)

/** Troca o cliente HTTP da store (usado pelos testes com um backend fake). */
export function definirServicoImportacao(novo: ServicoImportacao): void {
  servico = novo
}

function resumir(arquivo: File): PlanilhaEnviada {
  return { nome: arquivo.name, tamanho: arquivo.size }
}

/**
 * Planilhas escolhidas, a fila de envio e o histórico da tela "Importar base do mês" (A6-79).
 * Fica numa store para a fila seguir mês a mês quando o Supervisor sai da tela.
 * Ex.: store.escolher(arquivosDoDataset); await store.importar()
 */
export const useImportacaoStore = defineStore('importacao', () => {
  const escolhidas = ref<File[]>([])
  const fila = ref<MesDaFila[]>([])
  const enviando = ref(false)
  const erroDaFila = ref<string | null>(null)
  const historico = ref<EnvioImportacao[]>([])
  const carregandoHistorico = ref(false)
  const falhaNoHistorico = ref(false)

  const separacao = computed(() => separarPorMes(escolhidas.value))
  const podeImportar = computed(
    () => escolhidas.value.length > 0 && separacao.value.problemas.length === 0 && !enviando.value,
  )

  /** Escolher de novo uma planilha com o mesmo nome troca a anterior. */
  function escolher(novas: File[]): void {
    const nomes = new Set(novas.map((a) => a.name))
    escolhidas.value = [...escolhidas.value.filter((a) => !nomes.has(a.name)), ...novas]
  }

  function remover(nome: string): void {
    escolhidas.value = escolhidas.value.filter((a) => a.name !== nome)
  }

  async function importar(): Promise<void> {
    if (!podeImportar.value) return
    const lotes = separacao.value.lotes
    fila.value = lotes.map((l) => ({ competencia: l.competencia, arquivos: l.arquivos.map(resumir), situacao: 'NA_FILA', jobId: null }))
    escolhidas.value = []
    await rodarFila(lotes.map((l) => l.arquivos))
  }

  /** Um mês com impeditivo não para os outros; um envio recusado (409, rede) para a fila toda. */
  async function rodarFila(planilhasPorMes: File[][]): Promise<void> {
    enviando.value = true
    erroDaFila.value = null
    try {
      for (const [indice, planilhas] of planilhasPorMes.entries()) await enviarMes(fila.value[indice]!, planilhas)
    } catch (erro) {
      erroDaFila.value = descreverFalhaDoEnvio(erro)
      fila.value.filter((m) => m.jobId === null).forEach((m) => (m.situacao = 'NAO_ENVIADO'))
    } finally {
      enviando.value = false
    }
  }

  async function enviarMes(mes: MesDaFila, planilhas: File[]): Promise<void> {
    mes.situacao = 'PROCESSANDO'
    mes.jobId = (await servico.enviar(planilhas)).id
    await acompanharMes(mes)
  }

  async function acompanharMes(mes: MesDaFila): Promise<void> {
    await servico.acompanhar(mes.jobId!, (job) => {
      mes.situacao = job.status
      mes.competencia ??= job.competencia
    })
    await buscarHistorico()
  }

  async function buscarHistorico(): Promise<void> {
    carregandoHistorico.value = true
    falhaNoHistorico.value = false
    try {
      historico.value = await servico.historico()
    } catch {
      falhaNoHistorico.value = true
    } finally {
      carregandoHistorico.value = false
    }
  }

  /** Ao abrir a tela: se há um job PROCESSANDO que esta aba não acompanha (recarregou, outra aba), retoma. */
  async function carregarHistorico(): Promise<void> {
    await buscarHistorico()
    const emAndamento = historico.value.find((e) => e.status === 'PROCESSANDO')
    if (!emAndamento || enviando.value) return
    fila.value = [{ competencia: emAndamento.competencia, arquivos: [], situacao: 'PROCESSANDO', jobId: emAndamento.id }]
    await rodarAcompanhamento(fila.value[0]!)
  }

  async function rodarAcompanhamento(mes: MesDaFila): Promise<void> {
    enviando.value = true
    try {
      await acompanharMes(mes)
    } catch (erro) {
      erroDaFila.value = descreverFalhaDoEnvio(erro)
    } finally {
      enviando.value = false
    }
  }

  /**
   * Relatório de um envio (GET /api/importacao/{id}); se ainda processa, acompanha até terminar.
   * Ex.: await abrirRelatorio(6, (job) => (mostrado.value = job))
   */
  async function abrirRelatorio(id: number, aoAtualizar: (job: JobImportacao) => void): Promise<JobImportacao> {
    const job = await servico.buscar(id)
    aoAtualizar(job)
    if (job.status !== 'PROCESSANDO') return job
    return servico.acompanhar(id, aoAtualizar)
  }

  /** Depois que a fila termina, volta para a escolha de planilhas. Com a fila rodando não faz nada. */
  function fecharFila(): void {
    if (enviando.value) return
    fila.value = []
    erroDaFila.value = null
  }

  return {
    escolhidas, separacao, podeImportar, fila, enviando, erroDaFila, historico, carregandoHistorico,
    falhaNoHistorico, escolher, remover, importar, carregarHistorico, abrirRelatorio, fecharFila,
  }
})
