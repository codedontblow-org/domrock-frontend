import type { EventoAgente, PassoTrilha, TrilhaChat } from './types'

function mapearPasso(passo: PassoTrilha): EventoAgente {
  const situacao = passo.mensagem_erro
    ? `${passo.situacao || 'ERRO'}: ${passo.mensagem_erro}`
    : passo.situacao
  return {
    ferramenta: passo.ferramenta,
    descricao_legivel: passo.descricao,
    tempo: passo.tempo_ms,
    situacao,
    tabelas: passo.tabelas_acessadas,
    competencias: passo.competencias,
    filtros: passo.filtros,
    registros: passo.registros_retornados,
    sql: passo.sql_executado,
    result: passo.dados !== null && passo.dados !== undefined ? { dados: passo.dados } : undefined,
  }
}

/**
 * Converte a trilha de passos gravada pelo backend (contrato 2.2) para a lista de eventos
 * que o FerramentasDropdown exibe na interface.
 *
 * @example
 * const eventos = eventosDaTrilha({
 *   modelo: 'gemini-3.5-flash-lite',
 *   tentativas: null,
 *   premissas: [],
 *   passos: [{
 *     ordem: 1,
 *     ferramenta: 'consultar_banco',
 *     descricao: 'Venda da marca 30 em out/2025',
 *     tabelas_acessadas: ['venda', 'loja'],
 *     competencias: ['2025-10'],
 *     filtros: 'marca 30',
 *     sql_executado: 'SELECT ...',
 *     registros_retornados: 1,
 *     dados: [{ qtd_vendas: 188, total: 333666.01 }],
 *     tempo_ms: 340,
 *     situacao: 'SUCESSO',
 *     mensagem_erro: null,
 *   }],
 * })
 */
export function eventosDaTrilha(trilha: TrilhaChat | null | undefined): EventoAgente[] {
  if (!trilha?.passos?.length) return []
  return trilha.passos.map(mapearPasso)
}
