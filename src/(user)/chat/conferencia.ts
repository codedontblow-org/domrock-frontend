import { NOMES_CARGO, NOMES_MARCA } from './rotulos'
import type {
  ComissaoNoTrecho,
  ConflitoCampanha,
  Periodo,
  RegraCampanha,
  ResultadoSimulacao,
} from './types'

/** Limite de caracteres para o nome da campanha (contrato do backend CampanhaService). */
export const NOME_MAXIMO = 150

export interface ConferenciaCampanha {
  inicio: string | null
  fim: string | null
  acrescimo: number | null
  cargos: string[]
  marcas: string[]
  custoIncremental: number | null
  comissaoPeriodo?: ComissaoNoTrecho[]
  conflitos?: ConflitoCampanha[]
}

/** Valida se o parâmetro de período possui o formato esperado de objeto com datas. */
function extrairPeriodo(valor: unknown): Periodo | null {
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    const periodo = valor as Periodo
    if (typeof periodo.data_inicio === 'string' && typeof periodo.data_fim === 'string') {
      return periodo
    }
  }
  return null
}

/** Monta as informações de conferência para o modal de compartilhamento (protótipo 388:760). */
export function montarConferencia(
  regra: RegraCampanha,
  resultado?: ResultadoSimulacao | null,
): ConferenciaCampanha {
  const param = (key: string) => regra.parametros.find((p) => p.key === key)?.value
  const periodo = extrairPeriodo(param('periodo'))
  const acrescimo = param('pct_acrescimo')

  const extrairRotulos = (key: string, mapa: Record<string, string>): string[] => {
    const val = param(key)
    if (!Array.isArray(val)) return []
    return val.map((id) => mapa[id] ?? (id === 'ALL' ? 'Todos' : id))
  }

  return {
    inicio: periodo?.data_inicio ?? null,
    fim: periodo?.data_fim ?? null,
    acrescimo: typeof acrescimo === 'number' ? acrescimo : null,
    cargos: extrairRotulos('cargos_alvo', NOMES_CARGO),
    marcas: extrairRotulos('marcas_alvo', NOMES_MARCA),
    custoIncremental: resultado?.orcamento ? resultado.orcamento.custo_incremental : null,
    comissaoPeriodo: resultado?.comissao_periodo,
    conflitos: resultado?.conflitos,
  }
}
