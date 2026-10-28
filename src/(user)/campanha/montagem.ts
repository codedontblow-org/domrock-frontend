import { formatarMoeda, formatarPercentual } from '../chat/formatacao'
import { NOMES_CARGO, NOMES_MARCA } from '../chat/rotulos'
import type { Periodo, RegraCampanha } from '../chat/types'
import type { ListaCampanha } from './components/ListaCampanha.vue'
import type { Tabela } from './components/TabelaCampanhas.vue'
import type {
  CampanhaAprovacao, CampanhaAprovada, CampanhaResumo, FilaCampanha, Interferencia, ItemDetalhe, PeriodoCampanha,
  VersaoCampanha,
} from './types'

const TODAS_AS_MARCAS = 'ALL'
/** Marcas da base (10 a 60): o backend devolve as seis quando a regra pediu "ALL". */
const QUANTIDADE_DE_MARCAS = 6

/**
 * Exemplos fixos até o backend ter rota de interferências (eventos de RH e campanhas sobrepostas):
 * mantêm a seção e as menções na devolução funcionando.
 */
export const INTERFERENCIAS_PROVISORIAS: Interferencia[] = [
  { id: 1, tipo: 'Intercorrência', descricao: 'Faltas abonadas para Vendedores loja na semana' },
  { id: 2, tipo: 'Campanha', descricao: 'Acréscimo de +0,25% para Vendedores loja' },
  { id: 3, tipo: 'Intercorrência', descricao: 'Sem estoque de produtos da marca Cinza' },
]
const DIA_MES = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

export function diaMesDeData(iso: string): string {
  const [, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}`
}

export function diaMesDeInstante(instante: string): string {
  return DIA_MES.format(new Date(instante))
}

export function duracaoEmDias(periodo: PeriodoCampanha | Periodo | null): number | null {
  if (!periodo?.data_inicio || !periodo.data_fim) return null
  const emDias = (iso: string) => {
    const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
    return Date.UTC(ano!, mes! - 1, dia) / 86_400_000
  }
  return emDias(periodo.data_fim) - emDias(periodo.data_inicio) + 1
}

function statusDaFila(item: FilaCampanha): string {
  if (item.resimulacao_necessaria) return 'Resimulação necessária'
  if (item.conflitos > 0) return item.conflitos === 1 ? '1 conflito' : `${item.conflitos} conflitos`
  return 'Sem conflitos'
}

function cartaoBase(
  campos: Pick<CampanhaAprovacao, 'id' | 'versao' | 'titulo' | 'sugeridoPor' | 'submetidoEm' | 'status'>,
  periodo: PeriodoCampanha | null,
  custo: number | null,
): CampanhaAprovacao {
  return {
    ...campos,
    inicio: periodo ? diaMesDeData(periodo.data_inicio) : '—',
    fim: periodo ? diaMesDeData(periodo.data_fim) : '—',
    duracaoDias: duracaoEmDias(periodo),
    custo: custo === null ? '—' : formatarMoeda(custo),
    custoDetalhe: null,
    percentual: null,
    alcance: null,
    detalhe: campos.versao === null ? 'indisponivel' : 'carregando',
    interferencias: INTERFERENCIAS_PROVISORIAS,
  }
}

/** Card do Supervisor, a partir de GET /api/campanhas/fila. */
export function cartaoDaFila(item: FilaCampanha): CampanhaAprovacao {
  return cartaoBase({
    id: item.id,
    versao: item.versao,
    titulo: item.nome,
    sugeridoPor: item.autor.nome ?? 'Autor desconhecido',
    submetidoEm: diaMesDeInstante(item.submetida_em),
    status: statusDaFila(item),
  }, item.periodo, item.custo_adicional)
}

/** Card do Gerente, a partir de "minhas" em AGUARDANDO_APROVACAO: a última atualização é a submissão. */
export function cartaoDeMinhas(item: CampanhaResumo, autor: string): CampanhaAprovacao {
  return cartaoBase({
    id: item.id,
    versao: item.versao_atual,
    titulo: item.nome,
    sugeridoPor: autor,
    submetidoEm: diaMesDeInstante(item.atualizada_em),
    status: 'Aguardando',
  }, item.periodo, item.custo_adicional)
}

function valorDe<T>(regra: RegraCampanha, key: string): T | null {
  return (regra.parametros.find((parametro) => parametro.key === key)?.value as T | undefined) ?? null
}

function plural(quantidade: number, singular: string, varios: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : varios}`
}

export function descreverAlcance(cargos: string[], marcas: string[]): string {
  const textoMarcas = marcas.includes(TODAS_AS_MARCAS) ? 'todas as marcas' : plural(marcas.length, 'marca', 'marcas')
  return `Afeta ${plural(cargos.length, 'cargo', 'cargos')} e ${textoMarcas}.`
}

/** Ex.: (1500, 20000) -> "7,5% do orçamento." */
export function usoDoOrcamento(custo: number, limite: number): string | null {
  if (limite <= 0) return null
  return `${formatarPercentual(Math.round((custo / limite) * 1000) / 10)} do orçamento.`
}

export function comVersao(cartao: CampanhaAprovacao, versao: VersaoCampanha): CampanhaAprovacao {
  const { regra, resultado } = versao
  const pct = valorDe<number>(regra, 'pct_acrescimo')
  const cargos = valorDe<string[]>(regra, 'cargos_alvo') ?? []
  const marcas = valorDe<string[]>(regra, 'marcas_alvo') ?? []
  const { orcamento, totais } = resultado
  const percentual = pct === null ? null : `+${formatarPercentual(pct)}`

  const acrescimos: ItemDetalhe[] = [
    ...(percentual ? [{ rotulo: 'Acréscimo', valor: percentual }] : []),
    { rotulo: 'Comissão atual', valor: formatarMoeda(totais.baseline) },
    { rotulo: 'Com a campanha', valor: formatarMoeda(totais.simulado) },
    { rotulo: 'Na comissão', valor: `+${formatarPercentual(totais.diferenca_pct)}`, destaque: true },
  ]


  return {
    ...cartao,
    duracaoDias: cartao.duracaoDias ?? duracaoEmDias(valorDe<Periodo>(regra, 'periodo')),
    custo: formatarMoeda(totais.diferenca),
    // Sem orçamento (A6-72), não há uso do orçamento para mostrar abaixo do custo.
    custoDetalhe: orcamento ? usoDoOrcamento(orcamento.custo_incremental, orcamento.orcamento_limite) : null,
    percentual,
    alcance: descreverAlcance(cargos, marcas),
    detalhe: 'pronto',
    descricao: resultado.explicacao || regra.raw_prompt,
    acrescimos,
    simulacaoId: versao.simulacao_id,
    cargos: cargos.map((codigo) => NOMES_CARGO[codigo] ?? codigo),
    marcas: marcas.map((codigo) => NOMES_MARCA[codigo] ?? codigo),
    conflitos: resultado.conflitos,
    acoes: versao.acoes,
    avisoResimulacao: avisoDeResimulacao(versao),
    custoResimulado: versao.resimulacao ? formatarMoeda(versao.resimulacao.resultado.totais.diferenca) : null,
  }
}

/**
 * Por que aprovar está fora das ações (contrato 5.6). Ex.: com a Semana do Vendedor aprovada por Sílvia
 * depois da submissão -> "Outra campanha deste período foi aprovada depois da submissão: Semana do
 * Vendedor (Sílvia). Simule de novo antes de aprovar."
 */
export function avisoDeResimulacao(versao: VersaoCampanha): string | null {
  if (!versao.resimulacao_necessaria) return null
  const campanhas = versao.aprovadas_depois.map((outra) => `${outra.nome} (${outra.aprovador})`).join(', ')
  return `Outra campanha deste período foi aprovada depois da submissão: ${campanhas}. Simule de novo antes de aprovar.`
}

function dataCompleta(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

/** Linha de "Campanhas Passadas". Ex.: as seis marcas -> "Todas"; cargos ["100", "150"] -> "Vendedor loja, Gerente" */
export function linhaAprovada(item: CampanhaAprovada): Tabela {
  const todasAsMarcas = item.marcas.length === QUANTIDADE_DE_MARCAS
  return {
    id: item.id,
    titulo: item.nome,
    inicio: dataCompleta(item.periodo.data_inicio),
    fim: dataCompleta(item.periodo.data_fim),
    cargo: item.cargos.map((codigo) => NOMES_CARGO[codigo] ?? codigo).join(', ') || undefined,
    marca: todasAsMarcas ? 'Todas' : item.marcas.map((codigo) => NOMES_MARCA[codigo] ?? codigo).join(', ') || undefined,
    percentual: item.pct_acrescimo === null ? '—' : `+${formatarPercentual(item.pct_acrescimo)}`,
  }
}

export interface DetalheAprovada extends ListaCampanha {
  simulacaoId: number
}

export function detalheAprovada(item: CampanhaAprovada): DetalheAprovada {
  return {
    titulo: item.nome,
    inicio: diaMesDeData(item.periodo.data_inicio),
    fim: diaMesDeData(item.periodo.data_fim),
    percentual: item.pct_acrescimo === null ? null : `+${formatarPercentual(item.pct_acrescimo)}`,
    alcance: descreverAlcance(item.cargos, item.marcas.length === QUANTIDADE_DE_MARCAS ? [TODAS_AS_MARCAS] : item.marcas),
    custo: formatarMoeda(item.custo_adicional),
    custoDetalhe: null,
    sugeridoPor: item.autor.nome ?? 'Autor desconhecido',
    submetidoEm: diaMesDeInstante(item.submetida_em),
    status: 'Aprovada',
    simulacaoId: item.simulacao_id,
  }
}

export function montarJustificativa(comentario: string, citadas: { tipo: string; descricao: string }[]): string {
  const texto = comentario.trim()
  if (citadas.length === 0) return texto
  return `${texto}\n\nInterferências citadas:\n${citadas.map((item) => `- ${item.tipo}: ${item.descricao}`).join('\n')}`
}
