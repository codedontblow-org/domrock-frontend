import type { RegraCampanha, ResumoCampanha, ResultadoSimulacao } from './types'

export function formatarData(data: string | null | undefined): string {
  if (!data) return 'Não informado'
  const [ano, mes, dia] = data.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function resumirCampanha(
  regra: RegraCampanha,
  resultado?: ResultadoSimulacao,
): ResumoCampanha {
  const valor = (key: string) => regra.parametros.find((p) => p.key === key)?.value
  const rotulos = (key: string): string[] => {
    const parametro = regra.parametros.find((p) => p.key === key)
    return Array.isArray(parametro?.value)
      ? parametro.value.map(
          (id) =>
            parametro.options?.find((o) => o.id === id)?.label ?? (id === 'ALL' ? 'Todos' : id),
        )
      : []
  }
  const periodo = valor('periodo')
  const acrescimo = valor('pct_acrescimo')
  return {
    nome: regra.raw_prompt || 'Campanha atual',
    inicio:
      periodo && typeof periodo === 'object' && !Array.isArray(periodo)
        ? periodo.data_inicio
        : null,
    fim:
      periodo && typeof periodo === 'object' && !Array.isArray(periodo) ? periodo.data_fim : null,
    acrescimo: typeof acrescimo === 'number' ? acrescimo : null,
    cargos: rotulos('cargos_alvo'),
    marcas: rotulos('marcas_alvo'),
    investimento: resultado?.orcamento.custo_incremental,
    conflitos: resultado?.conflitos,
  }
}
