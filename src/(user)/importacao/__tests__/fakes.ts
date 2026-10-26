import axios, { AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { EnvioImportacao, JobImportacao, PendenciaImportacao, SituacaoJob } from '../types'

export { FakeEspera } from '../../chat/__tests__/fakes'

export function pendencia(severidade: PendenciaImportacao['severidade'], motivo: string, linha = 0): PendenciaImportacao {
  return { origem: 'BASE RH_OUT25.xlsx', linha, campo: 'Matricula', motivo, severidade }
}

/** Job no formato completo do contrato 7.2 (out/2025 do dataset, concluído com um aviso). */
export function job(id: number, status: SituacaoJob, mudar: Partial<JobImportacao> = {}): JobImportacao {
  const processando = status === 'PROCESSANDO'
  return {
    id, status,
    competencia: processando ? null : '2025-10',
    usuario: 'Sérgio',
    total_linhas: processando ? 0 : 5469,
    linhas_importadas: status === 'CONCLUIDO' ? 5467 : 0,
    totais: status === 'CONCLUIDO' ? { RH: 469, VENDAS: 4998, COMISSAO: 0 } : {},
    pendencias: processando ? [] : [pendencia('AVISO', 'matrícula MATRIC-207 não encontrada no RH da competência', 681)],
    criada_em: '2026-10-20T04:38:00Z',
    concluida_em: processando ? null : '2026-10-20T04:39:00Z',
    ...mudar,
  }
}

/** Linha do histórico (7.2, sem totais e pendências). */
export function envio(id: number, status: SituacaoJob, competencia: string | null): EnvioImportacao {
  const { totais: _totais, pendencias: _pendencias, ...resto } = job(id, status, { competencia })
  return resto
}

export interface PedidoRecebido {
  metodo: string
  url: string
  /** Nomes das planilhas no campo `arquivos` do multipart. */
  arquivos: string[]
}

/**
 * Backend da importação em memória: cada POST cria o próximo job e cada GET do job devolve o
 * próximo estado programado para ele (o último se repete). `recusarEnvio` responde o POST com erro.
 */
export class FakeBackendImportacao {
  pedidos: PedidoRecebido[] = []
  historico: EnvioImportacao[] = []
  recusarEnvio: number | null = null
  private proximoId = 1
  private readonly estados = new Map<number, JobImportacao[]>()

  /** Programa os estados que o GET do job `id` devolve, em ordem. */
  programar(id: number, ...estados: JobImportacao[]): void {
    this.estados.set(id, estados)
  }

  http(): AxiosInstance {
    return axios.create({ adapter: (config) => this.responder(config as InternalAxiosRequestConfig) })
  }

  private async responder(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
    const url = config.url ?? ''
    this.pedidos.push({ metodo: config.method ?? '', url, arquivos: nomesDoMultipart(config.data) })
    if (config.method === 'post') return this.criarJob(config)
    const id = Number(url.split('/').pop())
    if (Number.isNaN(id)) return resposta(config, 200, this.historico)
    return resposta(config, 200, this.proximoEstado(id))
  }

  private criarJob(config: InternalAxiosRequestConfig): AxiosResponse {
    if (this.recusarEnvio) {
      const recusa = resposta(config, this.recusarEnvio, { status: this.recusarEnvio })
      throw new AxiosError('recusado', 'ERR_BAD_REQUEST', config, null, recusa)
    }
    return resposta(config, 202, { id: this.proximoId++, status: 'PROCESSANDO' })
  }

  private proximoEstado(id: number): JobImportacao {
    const fila = this.estados.get(id) ?? [job(id, 'CONCLUIDO')]
    return fila.length > 1 ? fila.shift()! : fila[0]!
  }
}

function nomesDoMultipart(corpo: unknown): string[] {
  if (!(corpo instanceof FormData)) return []
  return corpo.getAll('arquivos').map((parte) => (parte as File).name)
}

function resposta(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  return { status, statusText: '', headers: {}, config, data }
}

export function planilha(nome: string, bytes = 1024): File {
  return new File([new Uint8Array(bytes)], nome)
}
