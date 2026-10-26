import { isAxiosError, type AxiosInstance } from 'axios'
import type { EnvioImportacao, JobCriado, JobImportacao } from '../types'

/** Mesmo intervalo da simulação (contrato 4.2): o backend não informa porcentagem, só o status. */
const INTERVALO_CONSULTA_MS = 2000

function esperarDeVerdade(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Chamadas da importação da base do mês (contrato 7, só Supervisor). Recebe o cliente HTTP e a
 * espera do polling para ser testável. Ex.: await criarServicoImportacao(api).enviar(planilhasDeOutubro)
 */
export function criarServicoImportacao(http: AxiosInstance, esperar: (ms: number) => Promise<void> = esperarDeVerdade) {
  async function buscar(id: number): Promise<JobImportacao> {
    const { data } = await http.get<JobImportacao>(`/api/importacao/${id}`)
    return data
  }

  return {
    buscar,

    /** Um mês por envio: RH e Vendas, e a Comissão quando houver (7.1). Responde 202 com o job. */
    async enviar(arquivos: File[]): Promise<JobCriado> {
      const corpo = new FormData()
      arquivos.forEach((arquivo) => corpo.append('arquivos', arquivo))
      const { data } = await http.post<JobCriado>('/api/importacao', corpo)
      return data
    },

    /** Do mais recente para o mais antigo (7.2). */
    async historico(): Promise<EnvioImportacao[]> {
      const { data } = await http.get<EnvioImportacao[]>('/api/importacao')
      return data
    },

    /**
     * Consulta o job até sair de PROCESSANDO. Sem limite de consultas: o backend encerra como FALHA
     * o job que ficou preso por um reinício. Ex.: await acompanhar(7, (job) => mostrar(job.status))
     */
    async acompanhar(id: number, aoAtualizar: (job: JobImportacao) => void = () => {}): Promise<JobImportacao> {
      for (;;) {
        await esperar(INTERVALO_CONSULTA_MS)
        const job = await buscar(id)
        aoAtualizar(job)
        if (job.status !== 'PROCESSANDO') return job
      }
    },
  }
}

export type ServicoImportacao = ReturnType<typeof criarServicoImportacao>

const TEXTO_DO_STATUS: Record<number, string> = {
  400: 'O servidor recusou as planilhas. Confira se são .xlsx e se os nomes dizem o tipo e o mês.',
  403: 'Só o Supervisor pode importar a base do mês.',
  409: 'Já existe uma importação em andamento. Espere ela terminar para enviar outra.',
}

/**
 * O 400 e o 409 do envio vêm sem `message` no corpo (contrato 7.1): o texto sai do status.
 * Ex.: descreverFalhaDoEnvio(erroCom409) -> 'Já existe uma importação em andamento. ...'
 */
export function descreverFalhaDoEnvio(erro: unknown): string {
  if (!isAxiosError(erro)) return 'Algo saiu do esperado. Tente de novo.'
  if (!erro.response) return 'Sem resposta do servidor. Confira se o backend está no ar.'
  const { status } = erro.response
  return TEXTO_DO_STATUS[status] ?? `O servidor respondeu ${status}. Tente de novo.`
}
