import { formatarMilhares } from '../chat/formatacao'
import { formatarCompetencia, formatarDataHora, formatarHora } from './formatacao'
import type { JobImportacao, PendenciaImportacao, Severidade, SituacaoJob } from './types'

export type FiltroPendencias = 'TODAS' | Severidade

export interface NumeroDoResultado {
  rotulo: string
  valor: string
}

/** Ex.: contagemPorFiltro([impeditivo, aviso]) -> { TODAS: 2, IMPEDITIVO: 1, AVISO: 1 } */
export function contagemPorFiltro(pendencias: PendenciaImportacao[]): Record<FiltroPendencias, number> {
  const contar = (severidade: Severidade) => pendencias.filter((p) => p.severidade === severidade).length
  return { TODAS: pendencias.length, IMPEDITIVO: contar('IMPEDITIVO'), AVISO: contar('AVISO') }
}

/** O impeditivo é o que o Supervisor precisa corrigir: o relatório abre nele quando existe. */
export function filtroInicial(pendencias: PendenciaImportacao[]): FiltroPendencias {
  return pendencias.some((p) => p.severidade === 'IMPEDITIVO') ? 'IMPEDITIVO' : 'TODAS'
}

export function filtrarPendencias(pendencias: PendenciaImportacao[], filtro: FiltroPendencias): PendenciaImportacao[] {
  return filtro === 'TODAS' ? pendencias : pendencias.filter((p) => p.severidade === filtro)
}

/** Linha 0 é pendência do arquivo todo (protótipo: "—"). Ex.: textoDaLinha(0) -> '—' */
export function textoDaLinha(linha: number | null): string {
  return linha ? String(linha) : '—'
}

/** Ex.: tituloDoEnvio(jobDeOutubro) -> 'Envio de out/2025'; sem mês lido -> 'Envio nº 6' */
export function tituloDoEnvio(job: Pick<JobImportacao, 'id' | 'competencia'>): string {
  return job.competencia ? `Envio de ${formatarCompetencia(job.competencia)}` : `Envio nº ${job.id}`
}

const FIM_DO_ENVIO: Record<SituacaoJob, string | null> = {
  PROCESSANDO: null,
  CONCLUIDO: 'concluído',
  PENDENTE: 'analisado',
  FALHA: 'interrompido',
}

/** Ex.: 'Enviado por Sérgio em 20/10/2026 às 01:38 · concluído às 01:39' */
export function metaDoEnvio(job: JobImportacao, fuso?: string): string {
  const [dia, hora] = formatarDataHora(job.criada_em, fuso).split(' ')
  const envio = `Enviado por ${job.usuario ?? '—'} em ${dia} às ${hora}`
  const fim = FIM_DO_ENVIO[job.status]
  if (!fim || !job.concluida_em) return envio
  return `${envio} · ${fim} às ${formatarHora(job.concluida_em, fuso)}`
}

const ALERTA: Partial<Record<SituacaoJob, string>> = {
  PENDENTE: 'Planilha com pendências: corrija e envie novamente. Nada foi gravado.',
  FALHA: 'A importação falhou e nada foi gravado. Veja o motivo abaixo e envie de novo.',
}

export function alertaDoEnvio(status: SituacaoJob): string | null {
  return ALERTA[status] ?? null
}

const ROTULO_DO_TOTAL: Array<[string, string]> = [['RH', 'RH'], ['VENDAS', 'Vendas'], ['COMISSAO', 'Comissão']]

/** Linhas lidas e gravadas; o total por planilha só existe quando o job gravou (CONCLUIDO). */
export function numerosDoResultado(job: JobImportacao): NumeroDoResultado[] {
  const numeros = [
    { rotulo: 'Linhas lidas', valor: formatarMilhares(job.total_linhas) },
    { rotulo: 'Linhas gravadas', valor: formatarMilhares(job.linhas_importadas) },
  ]
  if (job.status !== 'CONCLUIDO') return numeros
  const totais = ROTULO_DO_TOTAL.map(([chave, rotulo]) => ({ rotulo, valor: formatarMilhares(job.totais?.[chave] ?? 0) }))
  return [...numeros, ...totais]
}
