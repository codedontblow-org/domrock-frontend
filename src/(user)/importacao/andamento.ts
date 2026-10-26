import { formatarCompetencia } from './formatacao'
import { tipoDaPlanilha } from './planilhas'
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

/** Envio da Comissão sozinha: o backend nunca devolve mês para ele, então o nome das planilhas decide. */
function soComissao(mes: MesDaFila): boolean {
  return mes.arquivos.length > 0 && mes.arquivos.every((a) => tipoDaPlanilha(a.nome) === 'COMISSAO')
}

function rotuloDoEnvioUnico(mes: MesDaFila): string {
  if (mes.competencia) return formatarCompetencia(mes.competencia)
  return soComissao(mes) ? 'Comissão' : 'Lendo as planilhas'
}

function resumoRodando(fila: MesDaFila[]): string {
  const indice = Math.max(0, fila.findIndex((m) => m.situacao === 'PROCESSANDO'))
  const atual = fila[indice]!
  if (fila.length === 1) return rotuloDoEnvioUnico(atual)
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
