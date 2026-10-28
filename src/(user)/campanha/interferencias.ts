import { NOMES_CARGO, statusLegivelConflito } from '../chat/rotulos'
import type { ConflitoCampanha } from '../chat/types'
import { diaMesDeData } from './montagem'
import type { IntercorrenciaVersao, Interferencia } from './types'

/**
 * Converte intercorrências reais de RH e conflitos com outras campanhas em itens de
 * interferência para exibição no painel de aprovação e citação na justificativa de devolução.
 *
 * <pre>
 * const itens = interferenciasDaVersao(versao.intercorrencias ?? [], resultado.conflitos ?? [])
 * </pre>
 */

const NOMES_TIPO_RH: Record<IntercorrenciaVersao['tipo'], string> = {
  afastamento: 'Afastamento',
  ferias: 'Férias',
  licenca_maternidade: 'Licença maternidade',
  demissao: 'Demissão',
}

function formatarDatasRH(item: IntercorrenciaVersao): string {
  if (item.tipo === 'demissao') {
    return `em ${diaMesDeData(item.data_inicio)}`
  }
  if (item.data_fim) {
    return `${diaMesDeData(item.data_inicio)} a ${diaMesDeData(item.data_fim)}`
  }
  return `desde ${diaMesDeData(item.data_inicio)}`
}

function descreverIntercorrencia(item: IntercorrenciaVersao): string {
  const tipo = NOMES_TIPO_RH[item.tipo] ?? item.tipo
  const cargo = item.cargo ? ` (${NOMES_CARGO[item.cargo] ?? item.cargo})` : ''
  return `${tipo} de ${item.matricula}${cargo}, ${formatarDatasRH(item)}`
}

function descreverConflito(conflito: ConflitoCampanha): string {
  const status = statusLegivelConflito(conflito.status)
  const inicio = diaMesDeData(conflito.sobreposicao.data_inicio)
  const fim = diaMesDeData(conflito.sobreposicao.data_fim)
  return `${conflito.nome} (${status}), ${inicio} a ${fim}`
}

function idIntercorrencia(item: IntercorrenciaVersao): string {
  return `rh-${item.matricula}-${item.tipo}-${item.data_inicio}`
}

function idConflito(conflito: ConflitoCampanha): string {
  return `campanha-${conflito.campanha_id ?? conflito.nome}-${conflito.versao ?? 1}`
}

/**
 * Junta os eventos de RH (primeiro) com os conflitos de campanha (depois),
 * produzindo identificadores estáveis e textos padronizados para o painel.
 */
export function interferenciasDaVersao(
  intercorrencias: IntercorrenciaVersao[],
  conflitos: ConflitoCampanha[],
): Interferencia[] {
  const deRh: Interferencia[] = intercorrencias.map((item) => ({
    id: idIntercorrencia(item),
    tipo: 'Intercorrência',
    descricao: descreverIntercorrencia(item),
  }))

  const deCampanha: Interferencia[] = conflitos.map((conflito) => ({
    id: idConflito(conflito),
    tipo: 'Campanha',
    descricao: descreverConflito(conflito),
  }))

  return [...deRh, ...deCampanha]
}
