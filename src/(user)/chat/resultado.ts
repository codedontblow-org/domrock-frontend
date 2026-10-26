// Textos e números dos blocos do resultado (A6-72): Meta → Comissão → Retorno → Orçamento.
// Só formata o que a Lana calculou; a única conta aqui é a escala das barras.
import { formatarMoeda, formatarPercentual } from './formatacao'
import type { AtingimentoMeta, ImpactoPessoas, RetornoCampanha, TotaisSimulacao, VereditoOrcamento } from './types'

export type TomResultado = 'positivo' | 'aviso' | 'negativo' | 'neutro' | 'destaque'

export interface SeloResultado {
  texto: string
  tom: TomResultado
}

export interface NumeroResultado {
  rotulo: string
  valor: string
  apoio?: string
  tomApoio?: TomResultado
}

/** Barra de 0 a 1. `marca` é onde fica a meta, ou null quando não há marca. */
export interface MedidorResultado {
  proporcao: number
  marca: number | null
  tom: TomResultado
}

// A escala da meta vai 5% além do maior entre a venda e a meta: a marca da meta nunca encosta na borda.
const FOLGA_DA_ESCALA = 1.05
const PERCENTUAL_DA_META = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Ex.: 80.2 -> "80,20%" (o critério do A6-72 mostra duas casas). */
export function pctDaMeta(meta: AtingimentoMeta): string {
  return `${PERCENTUAL_DA_META.format(meta.pct_atingimento)}%`
}

/** Venda − meta; simulações anteriores ao A6-72 não trazem `diferenca`. Ex.: 2.406.125,93 − 2.000.000 -> 406125.93 */
export function diferencaParaMeta(meta: AtingimentoMeta): number {
  return meta.diferenca ?? Math.round((meta.vendas_periodo - meta.meta_vendas) * 100) / 100
}

export function seloDaMeta(meta: AtingimentoMeta): SeloResultado {
  // Histórico, não previsão: "acima da meta", nunca "atingida" (a venda do período já aconteceu).
  return meta.atingida ? { texto: 'Acima da meta', tom: 'positivo' } : { texto: 'Abaixo da meta', tom: 'aviso' }
}

/** Ex.: "R$ 406.125,93 acima da meta" */
export function textoDiferencaMeta(meta: AtingimentoMeta): string {
  const diferenca = diferencaParaMeta(meta)
  return `${formatarMoeda(Math.abs(diferenca))} ${diferenca >= 0 ? 'acima' : 'abaixo'} da meta`
}

export function medidorDaMeta(meta: AtingimentoMeta): MedidorResultado {
  const escala = Math.max(meta.pct_atingimento, 100) * FOLGA_DA_ESCALA
  return { proporcao: meta.pct_atingimento / escala, marca: 100 / escala, tom: meta.atingida ? 'positivo' : 'aviso' }
}

export function numerosDaMeta(meta: AtingimentoMeta): NumeroResultado[] {
  return [
    { rotulo: 'Venda do período', valor: formatarMoeda(meta.vendas_periodo), apoio: 'marcas da campanha, todos os cargos' },
    { rotulo: 'Meta', valor: formatarMoeda(meta.meta_vendas) },
  ]
}

export function numerosDaComissao(totais: TotaisSimulacao, impacto: ImpactoPessoas): NumeroResultado[] {
  const recebem: NumeroResultado = {
    rotulo: 'Recebem o acréscimo',
    valor: `${impacto.pessoas_impactadas} de ${impacto.pessoas_total} pessoas`,
  }
  if (impacto.pessoas_impactadas) recebem.apoio = `média de ${formatarMoeda(impacto.media_por_pessoa)} cada`
  return [
    { rotulo: 'Sem a campanha', valor: formatarMoeda(totais.baseline) },
    {
      rotulo: 'Com a campanha', valor: formatarMoeda(totais.simulado),
      apoio: `+${formatarPercentual(totais.diferenca_pct)} na comissão`, tomApoio: 'destaque',
    },
    recebem,
  ]
}

export function numerosDoRetorno(retorno: RetornoCampanha): NumeroResultado[] {
  const numeros: NumeroResultado[] = []
  if (retorno.custo_pct_venda !== null) {
    numeros.push({ rotulo: 'Custo sobre a venda do período', valor: formatarPercentual(retorno.custo_pct_venda) })
  }
  if (retorno.custo_por_real_acima_meta !== null) {
    numeros.push({ rotulo: 'Custo por R$ 1 vendido acima da meta', valor: formatarMoeda(retorno.custo_por_real_acima_meta) })
  }
  return numeros
}

/** Por que falta o custo por R$ 1 acima da meta; null quando ele aparece. */
export function notaDoRetorno(retorno: RetornoCampanha): string | null {
  if (retorno.custo_por_real_acima_meta !== null) return null
  return 'A venda não passou da meta, então não há custo por R$ 1 vendido acima dela.'
}

export function seloDoOrcamento(orcamento: VereditoOrcamento): SeloResultado {
  return orcamento.cabe_no_orcamento
    ? { texto: 'Cabe no orçamento', tom: 'positivo' }
    : { texto: 'Não cabe no orçamento', tom: 'negativo' }
}

/** Até 100% a barra enche; acima disso fica cheia e muda de cor. */
export function medidorDoOrcamento(orcamento: VereditoOrcamento): MedidorResultado {
  const { custo_incremental: custo, orcamento_limite: limite } = orcamento
  const consumo = limite > 0 ? custo / limite : 1
  return { proporcao: Math.min(consumo, 1), marca: null, tom: orcamento.cabe_no_orcamento ? 'positivo' : 'negativo' }
}

/** Ex.: "Passa R$ 3.736,10 do orçamento de R$ 20.000,00." */
export function vereditoDoOrcamento(orcamento: VereditoOrcamento): string {
  const limite = formatarMoeda(orcamento.orcamento_limite)
  if (!orcamento.cabe_no_orcamento) return `Passa ${formatarMoeda(-orcamento.folga)} do orçamento de ${limite}.`
  const uso = orcamento.orcamento_limite > 0 ? (orcamento.custo_incremental / orcamento.orcamento_limite) * 100 : 0
  return `Usa ${formatarPercentual(uso)} do orçamento de ${limite}. Sobram ${formatarMoeda(orcamento.folga)}.`
}
