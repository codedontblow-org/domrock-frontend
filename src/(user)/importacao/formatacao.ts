import { formatarMilhares } from '../chat/formatacao'
import type { EnvioImportacao } from './types'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DECIMAL_DO_TAMANHO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const BYTES_POR_KB = 1024
const BYTES_POR_MB = 1024 * 1024

/** Ex.: formatarCompetencia('2025-10') -> 'out/2025'; null -> '—' */
export function formatarCompetencia(competencia: string | null): string {
  if (!competencia) return '—'
  const [ano, mes] = competencia.split('-')
  return `${MESES[Number(mes) - 1]}/${ano}`
}

/** O backend manda UTC; a tela mostra no fuso de quem usa. Ex.: '2026-10-20T04:37:00Z' -> '20/10/2026 01:37' */
export function formatarDataHora(iso: string, fuso?: string): string {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: fuso,
  }).formatToParts(new Date(iso))
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value
  return `${parte('day')}/${parte('month')}/${parte('year')} ${parte('hour')}:${parte('minute')}`
}

/** Ex.: formatarHora('2026-10-20T04:39:10Z') -> '01:39' */
export function formatarHora(iso: string, fuso?: string): string {
  return formatarDataHora(iso, fuso).split(' ')[1]!
}

/** Tamanho da planilha escolhida, como no protótipo. Ex.: formatarTamanho(62464) -> '61 KB' */
export function formatarTamanho(bytes: number): string {
  if (bytes >= BYTES_POR_MB) return `${DECIMAL_DO_TAMANHO.format(bytes / BYTES_POR_MB)} MB`
  return `${Math.max(1, Math.round(bytes / BYTES_POR_KB))} KB`
}

/** Coluna "Linhas gravadas" do histórico. Ex.: { linhas_importadas: 5462, total_linhas: 5468 } -> '5.462 de 5.468' */
export function linhasGravadas(envio: Pick<EnvioImportacao, 'status' | 'linhas_importadas' | 'total_linhas'>): string {
  if (envio.status === 'PROCESSANDO') return '—'
  return `${formatarMilhares(envio.linhas_importadas)} de ${formatarMilhares(envio.total_linhas)}`
}
