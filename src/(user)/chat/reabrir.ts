import { isAxiosError } from 'axios'
import type { AcaoCampanha, CampanhaDetalhe, UltimaSimulacao } from '../campanha/types'
import { eventosDaTrilha } from './trilha'
import type {
  MensagemChat,
  MensagemGravada,
  RegraCampanha,
  ResultadoSimulacao,
  SimulacaoAndamento,
} from './types'

export interface PermissoesCampanha {
  somenteLeitura: boolean
  podeVoltarRascunho: boolean
}

export interface EstadoSimulacaoReaberta {
  regra: RegraCampanha | null
  simulacaoId: number | null
  regraSimulada: string | null
  cabeNoOrcamento: boolean
}

export interface SimulacaoRestaurada {
  regra: RegraCampanha
  simulacaoId: number
  regraSimulada: string
  cabeNoOrcamento: boolean
  ultimaSimulacao: UltimaSimulacao
}

function converterUsuario(msg: MensagemGravada): MensagemChat {
  return {
    id: msg.id,
    chave: `b-${msg.id}`,
    papel: 'usuario',
    texto: msg.texto,
    criada_em: msg.criada_em,
  }
}

function converterLana(msg: MensagemGravada): MensagemChat {
  return {
    id: msg.id,
    chave: `b-${msg.id}`,
    papel: 'agente',
    texto: msg.texto,
    events: eventosDaTrilha(msg.trilha),
    criada_em: msg.criada_em,
  }
}

function converterSistema(
  msg: MensagemGravada,
  idUltima?: number | null,
  resUltima?: ResultadoSimulacao | null,
): MensagemChat {
  const anexar = msg.tipo === 'SIMULACAO' && Boolean(idUltima) && msg.simulacao_id === idUltima
  return {
    id: msg.id,
    chave: `b-${msg.id}`,
    papel: 'sistema',
    texto: msg.texto,
    tipo: msg.tipo,
    simulacao_id: msg.simulacao_id,
    criada_em: msg.criada_em,
    resultado: anexar ? (resUltima ?? undefined) : undefined,
  }
}

/**
 * Converte uma mensagem gravada no backend (contrato 3.2) no formato visual do front.
 * Anexa o resultado da última simulação se o id coincidir (contrato 5.2 / item 5).
 */
export function converterMensagemReaberta(
  msg: MensagemGravada,
  idUltimaSimulacao?: number | null,
  resultadoUltimaSimulacao?: ResultadoSimulacao | null,
): MensagemChat {
  if (msg.papel === 'usuario') return converterUsuario(msg)
  if (msg.papel === 'lana') return converterLana(msg)
  return converterSistema(msg, idUltimaSimulacao, resultadoUltimaSimulacao)
}

/**
 * Converte toda a lista de mensagens gravadas, mantendo a ordem original do backend.
 *
 * @example
 * const mensagens = converterHistorico(gravadas, campanha.ultima_simulacao)
 */
export function converterHistorico(
  mensagens: MensagemGravada[],
  ultimaSimulacao?: UltimaSimulacao | null,
): MensagemChat[] {
  const id = ultimaSimulacao?.id ?? null
  const resultado = ultimaSimulacao?.resultado ?? null
  return mensagens.map((m) => converterMensagemReaberta(m, id, resultado))
}

/**
 * Define permissões de edição a partir de campanha.acoes (contrato 5.2 / item 3).
 * RENOMEAR: autor em RASCUNHO -> chat editável.
 * EDITAR: autor em REPROVADA -> só leitura com botão "Editar campanha".
 * Outros casos: somente leitura.
 */
export function determinarPermissoesCampanha(acoes: AcaoCampanha[] = []): PermissoesCampanha {
  if (acoes.includes('RENOMEAR')) {
    return { somenteLeitura: false, podeVoltarRascunho: false }
  }
  if (acoes.includes('EDITAR')) {
    return { somenteLeitura: true, podeVoltarRascunho: true }
  }
  return { somenteLeitura: true, podeVoltarRascunho: false }
}

/**
 * Localiza a regra da última mensagem da Lana no histórico (contrato 3.2 / item 4).
 */
export function acharUltimaRegraLana(mensagens: MensagemGravada[]): RegraCampanha | null {
  for (let i = mensagens.length - 1; i >= 0; i--) {
    const m = mensagens[i]
    if (m?.papel === 'lana' && m.regra) return m.regra
  }
  return null
}

/**
 * Restaura ficha e parâmetros da simulação ao reabrir a campanha (item 4).
 * Usa ultima_simulacao se existir; senão busca a regra da última mensagem lana.
 */
export function extrairFichaEEstadoSimulacao(
  campanha: CampanhaDetalhe,
  mensagens: MensagemGravada[],
): EstadoSimulacaoReaberta {
  if (campanha.ultima_simulacao) {
    const { id, regra, resultado } = campanha.ultima_simulacao
    return {
      regra,
      simulacaoId: id,
      regraSimulada: JSON.stringify(regra),
      cabeNoOrcamento: resultado.orcamento?.cabe_no_orcamento ?? true,
    }
  }
  return {
    regra: acharUltimaRegraLana(mensagens),
    simulacaoId: null,
    regraSimulada: null,
    cabeNoOrcamento: false,
  }
}

/**
 * Extrai os dados restaurados de uma simulação concluída (item 6).
 */
export function extrairSimulacaoConcluida(sim: SimulacaoAndamento): SimulacaoRestaurada | null {
  if (!sim.resultado || !sim.ficha) return null
  return {
    regra: sim.ficha,
    simulacaoId: sim.id,
    regraSimulada: JSON.stringify(sim.ficha),
    cabeNoOrcamento: sim.resultado.orcamento?.cabe_no_orcamento ?? true,
    ultimaSimulacao: { id: sim.id, regra: sim.ficha, resultado: sim.resultado, concluida_em: '' },
  }
}

/**
 * Localiza o id da última mensagem de simulação da conversa para restaurar no F5 sem campanha.
 */
export function acharUltimoSimulacaoId(mensagens: MensagemGravada[]): number | null {
  for (let i = mensagens.length - 1; i >= 0; i--) {
    const m = mensagens[i]
    if (m?.tipo === 'SIMULACAO' && typeof m.simulacao_id === 'number') {
      return m.simulacao_id
    }
  }
  return null
}

/**
 * Lê o identificador do chat guardado para sobrevivência ao F5 (item 6).
 */
export function lerChatIdGuardado(): string | null {
  try {
    return localStorage.getItem('chat_id')
  } catch {
    return null
  }
}

/**
 * Grava ou remove o identificador do chat guardado (item 6).
 */
export function guardarChatId(id: string | null): void {
  try {
    if (id) localStorage.setItem('chat_id', id)
    else localStorage.removeItem('chat_id')
  } catch {
    // ignorar indisponibilidade de localStorage (ex.: modo anônimo estrito)
  }
}

/**
 * Extrai o código de status HTTP de um erro (Axios ou genérico).
 */
export function extrairStatusHttp(erro: unknown): number | null {
  if (isAxiosError(erro)) return erro.response?.status ?? null
  if (typeof erro === 'object' && erro !== null && 'status' in erro) {
    const s = (erro as { status: unknown }).status
    return typeof s === 'number' ? s : null
  }
  return null
}
