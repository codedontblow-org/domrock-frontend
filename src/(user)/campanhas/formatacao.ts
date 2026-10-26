import { formatarCelula, formatarMoeda, formatarPercentual } from '../chat/formatacao'
import type { ParametroRegra } from '../chat/types'
import type { PeriodoCampanha } from '../campanha/types'

const DIA_MES_ANO = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/**
 * Data sem hora do backend ("2025-11-24"). Lida como texto: `new Date` a trataria como meia-noite
 * UTC e, no Brasil, mostraria o dia anterior. Ex.: diaDaCampanha('2025-11-24') -> '24/11/2025'
 */
export function diaDaCampanha(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

/** Instante do backend no fuso de quem vê. Ex.: diaDoInstante('2026-10-21T14:20:00Z') -> '21/10/2026' */
export function diaDoInstante(instante: string | null): string {
  if (!instante) return '—'
  return DIA_MES_ANO.format(new Date(instante))
}

/** Ex.: periodoDaCampanha({ data_inicio: '2025-11-24', data_fim: '2025-11-30' }) -> '24/11/2025 – 30/11/2025' */
export function periodoDaCampanha(periodo: PeriodoCampanha | null): string {
  if (!periodo) return '—'
  return `${diaDaCampanha(periodo.data_inicio)} – ${diaDaCampanha(periodo.data_fim)}`
}

/** Ex.: custoDaCampanha(null) -> '—'; custoDaCampanha(23736.1) -> 'R$ 23.736,10' */
export function custoDaCampanha(valor: number | null): string {
  return valor === null ? '—' : formatarMoeda(valor)
}

/**
 * Valor de um parâmetro da ficha (contrato 2.1) para leitura. Códigos viram o rótulo das `options`.
 * Ex.: marcas_alvo ['30'] com a opção { id: '30', label: 'AZUL' } -> 'AZUL'; meta_vendas 2000000 -> 'R$ 2.000.000,00'
 */
export function valorDoParametro(parametro: ParametroRegra): string {
  const { value, options, type } = parametro
  if (typeof value === 'number' && type === 'currency') return formatarMoeda(value)
  if (typeof value === 'number' && type === 'percentage') return formatarPercentual(value)
  if (Array.isArray(value)) {
    return value.map((codigo) => options?.find((opcao) => opcao.id === codigo)?.label ?? codigo).join(', ') || '—'
  }
  if (value !== null && typeof value === 'object') {
    const { data_inicio, data_fim } = value
    return data_inicio && data_fim ? periodoDaCampanha({ data_inicio, data_fim }) : '—'
  }
  return formatarCelula(value)
}
