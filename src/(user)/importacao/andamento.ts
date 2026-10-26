import { formatarCompetencia } from './formatacao'
import type { MesDaFila, SituacaoDoMes } from './stores/importacao'

const TERMINADAS: SituacaoDoMes[] = ['CONCLUIDO', 'PENDENTE', 'FALHA']

/** Contagem do fim da fila, na ordem em que aparece: [situação, singular, plural]. */
const CONTAGEM: Array<[SituacaoDoMes, string, string]> = [
  ['CONCLUIDO', 'concluído', 'concluídos'],
  ['PENDENTE', 'pendente', 'pendentes'],
  ['FALHA', 'com falha', 'com falha'],
  ['NAO_ENVIADO', 'não enviado', 'não enviados'],
]

/** O job terminou no backend e tem relatório (GET /api/importacao/{id}). */
export function temRelatorio(mes: MesDaFila): boolean {
  return mes.jobId !== null && TERMINADAS.includes(mes.situacao)
}

function resumoRodando(fila: MesDaFila[]): string {
  const indice = Math.max(0, fila.findIndex((m) => m.situacao === 'PROCESSANDO'))
  const atual = fila[indice]!
  if (fila.length === 1) return atual.competencia ? formatarCompetencia(atual.competencia) : 'Lendo as planilhas'
  return `Mês ${indice + 1} de ${fila.length} · ${formatarCompetencia(atual.competencia)}`
}

function resumoTerminada(fila: MesDaFila[]): string {
  return CONTAGEM.map(([situacao, singular, plural]) => {
    const quantos = fila.filter((m) => m.situacao === situacao).length
    return quantos === 0 ? '' : `${quantos} ${quantos === 1 ? singular : plural}`
  })
    .filter(Boolean)
    .join(' · ')
}

/**
 * Linha abaixo do título do andamento. Ex.: rodando -> 'Mês 2 de 6 · ago/2025';
 * terminada -> '5 concluídos · 1 pendente'
 */
export function resumoDaFila(fila: MesDaFila[], rodando: boolean): string {
  return rodando ? resumoRodando(fila) : resumoTerminada(fila)
}
