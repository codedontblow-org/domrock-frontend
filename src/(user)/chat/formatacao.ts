import DOMPurify from 'dompurify'
import { marked } from 'marked'

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const PERCENTUAL = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/** Ex.: formatarMoeda(1668.33) -> "R$ 1.668,33" */
export function formatarMoeda(valor: number): string {
  return MOEDA.format(valor)
}

/** Ex.: formatarPercentual(0.49) -> "0,49%" */
export function formatarPercentual(valor: number): string {
  return `${PERCENTUAL.format(valor)}%`
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
