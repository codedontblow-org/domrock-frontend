import { formatarCompetencia } from './formatacao'

export type TipoPlanilha = 'RH' | 'VENDAS' | 'COMISSAO'

/** Só o nome decide o tipo e o mês: serve para `File` e para os objetos dos testes. */
export interface ArquivoNomeado {
  name: string
}

/** Planilhas de uma competência, enviadas juntas num job (o backend aceita um mês por envio). */
export interface LoteDoMes<T extends ArquivoNomeado> {
  /** null só no envio da Comissão sozinha (BASE_COMMISS_FINAL), que não é de mês nenhum. */
  competencia: string | null
  arquivos: T[]
}

export interface SeparacaoPorMes<T extends ArquivoNomeado> {
  lotes: LoteDoMes<T>[]
  problemas: string[]
}

const ROTULO_DO_TIPO: Record<TipoPlanilha, string> = { RH: 'RH', VENDAS: 'Vendas', COMISSAO: 'Comissão' }
const ORDEM_NO_LOTE: TipoPlanilha[] = ['RH', 'VENDAS', 'COMISSAO']
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
const PADRAO_DO_MES = new RegExp(`(${MESES.join('|')})(\\d{2})`, 'i')

/**
 * Mesma regra do `DetectorTipoArquivo` do backend, na mesma ordem (COMMISS antes de VENDAS e RH).
 * Ex.: tipoDaPlanilha('BASE RH_OUT25.xlsx') -> 'RH'
 */
export function tipoDaPlanilha(nome: string): TipoPlanilha | null {
  const maiusculo = nome.toUpperCase()
  if (maiusculo.includes('COMMISS') || maiusculo.includes('COMISS')) return 'COMISSAO'
  if (maiusculo.includes('VENDAS')) return 'VENDAS'
  if (maiusculo.includes('RH')) return 'RH'
  return null
}

/**
 * Mesma regra do `CompetenciaExtractor` do backend: mês abreviado seguido do ano com 2 dígitos.
 * Ex.: competenciaDoNome('BASE_VENDAS_OUT25.xlsx') -> '2025-10'
 */
export function competenciaDoNome(nome: string): string | null {
  const achado = PADRAO_DO_MES.exec(nome)
  if (!achado) return null
  const mes = MESES.indexOf(achado[1]!.toUpperCase()) + 1
  return `20${achado[2]}-${String(mes).padStart(2, '0')}`
}

interface PlanilhaLida<T extends ArquivoNomeado> {
  arquivo: T
  tipo: TipoPlanilha
  competencia: string | null
}

/** Problema que impede separar este arquivo, ou null se ele entra num mês. */
function problemaDoArquivo(nome: string): string | null {
  if (!nome.toLowerCase().endsWith('.xlsx')) return `${nome}: só planilhas .xlsx`
  const tipo = tipoDaPlanilha(nome)
  if (!tipo) return `${nome}: o nome não diz se é RH, Vendas ou Comissão`
  if (tipo !== 'COMISSAO' && !competenciaDoNome(nome)) return `${nome}: o nome não diz o mês (ex.: BASE RH_OUT25.xlsx)`
  return null
}

function agruparPorMes<T extends ArquivoNomeado>(lidas: PlanilhaLida<T>[]): Map<string | null, PlanilhaLida<T>[]> {
  const meses = new Map<string | null, PlanilhaLida<T>[]>()
  for (const lida of lidas.filter((l) => l.competencia)) {
    meses.set(lida.competencia, [...(meses.get(lida.competencia) ?? []), lida])
  }
  return new Map([...meses].sort(([a], [b]) => (a ?? '').localeCompare(b ?? '')))
}

/** A Comissão sem mês no nome (BASE_COMMISS_FINAL) vai com o primeiro mês, ou vira um envio próprio se não houver mês. */
function anexarComissaoSemMes<T extends ArquivoNomeado>(meses: Map<string | null, PlanilhaLida<T>[]>, lidas: PlanilhaLida<T>[]): string[] {
  const semMes = lidas.filter((l) => !l.competencia)
  if (semMes.length === 0) return []
  if (semMes.length > 1) return ['Mais de uma planilha de Comissão sem mês no nome']
  const primeiro = [...meses.keys()][0]
  if (!primeiro) {
    meses.set(null, [semMes[0]!])
    return []
  }
  meses.get(primeiro)!.push(semMes[0]!)
  return []
}

function problemasDoMes<T extends ArquivoNomeado>(competencia: string | null, planilhas: PlanilhaLida<T>[]): string[] {
  if (competencia === null) return []
  const mes = formatarCompetencia(competencia)
  return ORDEM_NO_LOTE.flatMap((tipo) => {
    const quantas = planilhas.filter((p) => p.tipo === tipo).length
    if (quantas > 1) return [`${mes}: mais de uma planilha de ${ROTULO_DO_TIPO[tipo]}`]
    if (quantas === 0 && tipo !== 'COMISSAO') return [`${mes}: falta a planilha de ${ROTULO_DO_TIPO[tipo]}`]
    return []
  })
}

function montarLote<T extends ArquivoNomeado>(competencia: string | null, planilhas: PlanilhaLida<T>[]): LoteDoMes<T> {
  const ordenadas = [...planilhas].sort((a, b) => ORDEM_NO_LOTE.indexOf(a.tipo) - ORDEM_NO_LOTE.indexOf(b.tipo))
  return { competencia, arquivos: ordenadas.map((p) => p.arquivo) }
}

/**
 * Separa as planilhas escolhidas em um lote por mês, em ordem cronológica, como o backend espera
 * (um job por competência, no máximo uma planilha de cada tipo). Com qualquer problema não monta
 * lote nenhum: nada é enviado pela metade.
 * Ex.: separarPorMes(arquivosDoDataset).lotes.map((l) => l.competencia) -> ['2025-07', ..., '2025-12']
 */
export function separarPorMes<T extends ArquivoNomeado>(arquivos: T[]): SeparacaoPorMes<T> {
  const problemas = arquivos.map((a) => problemaDoArquivo(a.name)).filter((p): p is string => p !== null)
  if (problemas.length > 0) return { lotes: [], problemas }

  const lidas = arquivos.map((arquivo) => ({ arquivo, tipo: tipoDaPlanilha(arquivo.name)!, competencia: competenciaDoNome(arquivo.name) }))
  const meses = agruparPorMes(lidas)
  problemas.push(...anexarComissaoSemMes(meses, lidas))
  meses.forEach((planilhas, competencia) => problemas.push(...problemasDoMes(competencia, planilhas)))
  if (problemas.length > 0) return { lotes: [], problemas }
  return { lotes: [...meses].map(([competencia, planilhas]) => montarLote(competencia, planilhas)), problemas }
}
