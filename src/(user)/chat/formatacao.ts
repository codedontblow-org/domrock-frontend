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

/** Markdown da Lana em HTML sanitizado (a resposta vem de uma LLM: nunca confiar). */
export function renderizarMarkdown(texto: string): string {
  return DOMPurify.sanitize(marked.parse(texto, { async: false }))
}
