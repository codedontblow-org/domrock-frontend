import DOMPurify from 'dompurify'
import { marked } from 'marked'

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const PERCENTUAL = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const PERCENTUAL_FIXO = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Ex.: formatarMoeda(1668.33) -> "R$ 1.668,33" */
export function formatarMoeda(valor: number): string {
  return MOEDA.format(valor)
}

/** Ex.: formatarPercentual(0.49) -> "0,49%" */
export function formatarPercentual(valor: number): string {
  return `${PERCENTUAL.format(valor)}%`
}

/** Ex.: formatarPercentualFixo(1) -> "1,00%"; formatarPercentualFixo(0.49) -> "0,49%" */
export function formatarPercentualFixo(valor: number): string {
  return `${PERCENTUAL_FIXO.format(valor)}%`
}

/** Saudação da tela inicial pelo primeiro nome. Ex.: saudacao("Ana Lima") -> "Olá, Ana!" */
export function saudacao(nome: string | null | undefined): string {
  const primeiroNome = nome?.trim().split(/\s+/)[0]
  return primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!'
}

/** Markdown da Lana em HTML sanitizado (a resposta vem de uma LLM: nunca confiar). */
export function renderizarMarkdown(texto: string): string {
  return DOMPurify.sanitize(marked.parse(texto, { async: false }))
}

const MILHARES = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

/** Ex.: formatarMilhares(2000000) -> "2.000.000" */
export function formatarMilhares(valor: number): string {
  return MILHARES.format(valor)
}

/** Só os dígitos viram reais inteiros; vazio vira null. Ex.: lerReaisInteiros("R$ 2.000.000") -> 2000000 */
export function lerReaisInteiros(texto: string): number | null {
  const digitos = texto.replace(/\D/g, '')
  return digitos === '' ? null : Number(digitos)
}

/** Aceita vírgula ou ponto decimal. Ex.: lerDecimal("0,84") -> 0.84; lerDecimal("abc") -> null */
export function lerDecimal(texto: string): number | null {
  const limpo = texto.replace('%', '').trim()
  // Com vírgula, o ponto é separador de milhar ("1.234,5"); sem vírgula, o ponto é decimal ("1.5").
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const valor = Number(normalizado)
  return normalizado === '' || Number.isNaN(valor) ? null : valor
}

const NUMERO_DA_TABELA = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/**
 * Célula dos dados que a consulta devolveu. Ex.: formatarCelula(333666.01) -> "333.666,01";
 * formatarCelula(2025) -> "2025" (inteiro sem separador: pode ser ano ou matrícula); null -> "—"
 */
export function formatarCelula(valor: unknown): string {
  if (valor === null || valor === undefined) return '—'
  if (typeof valor === 'number') return Number.isInteger(valor) ? String(valor) : NUMERO_DA_TABELA.format(valor)
  if (typeof valor === 'object') return JSON.stringify(valor)
  return String(valor)
}

/**
 * Formata data no padrão brasileiro (dd/mm/aaaa) a partir de string YYYY-MM-DD ou ISO.
 */
export function formatarData(data: string | null | undefined): string {
  if (!data) return 'Não informado'
  const [ano, mes, dia] = data.slice(0, 10).split('-')
  if (!ano || !mes || !dia) return 'Não informado'
  return `${dia}/${mes}/${ano}`
}

/** Data no fuso horário local em dd/mm/aaaa (evita salto de dia do UTC após 21h). */
export function dataLocal(data: Date = new Date()): string {
  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const ano = data.getFullYear()
  return `${dia}/${mes}/${ano}`
}

/**
 * Formata intervalo de datas para trecho de comissão (A6-75):
 * - Um dia: "24/11"
 * - Mesmo mês: "25 a 30/11"
 * - Meses diferentes: "25/11 a 05/12"
 */
export function formatarTrecho(inicio: string, fim: string): string {
  const [, mesIni, diaIni] = inicio.slice(0, 10).split('-')
  const [, mesFim, diaFim] = fim.slice(0, 10).split('-')
  if (inicio.slice(0, 10) === fim.slice(0, 10)) {
    return `${diaIni}/${mesIni}`
  }
  if (mesIni === mesFim) {
    return `${diaIni} a ${diaFim}/${mesFim}`
  }
  return `${diaIni}/${mesIni} a ${diaFim}/${mesFim}`
}

const DIA_MES_FORMATADOR = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

/**
 * Data curta (dd/mm) no fuso local para a lista de chats.
 * Ex.: formatarDiaMes('2026-10-21T13:00:12Z') -> '21/10'
 */
export function formatarDiaMes(iso: string | null | undefined): string {
  if (!iso) return ''
  return DIA_MES_FORMATADOR.format(new Date(iso))
}

/**
 * Data e hora curtas (dd/mm hh:mm) no fuso local para mensagens de sistema (status e simulação).
 * Ex.: formatarDataHoraCurta('2026-10-21T14:20:00Z') -> '21/10 11:20' (dependendo do fuso local)
 */
export function formatarDataHoraCurta(iso: string | null | undefined): string {
  if (!iso) return ''
  const partes = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(iso))
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? ''
  return `${parte('day')}/${parte('month')} ${parte('hour')}:${parte('minute')}`
}
