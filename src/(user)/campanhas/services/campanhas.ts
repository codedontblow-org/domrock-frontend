import type { AxiosInstance } from 'axios'
import type { AcaoCampanha, CampanhaDetalhe, CampanhaResumo, StatusCampanha } from '../types'
import { resultadoBlackFridayMock } from './mock-data'

export interface DadosSalvarCampanha {
  custo_incremental?: number | null
  periodo_inicio?: string
  periodo_fim?: string
  parametros?: import('../../chat/types').ParametroRegra[]
  resultado_simulacao?: import('../../chat/types').ResultadoSimulacao | null
}

export function criarServicoCampanhas(http: AxiosInstance) {
  return {
    async listar(): Promise<CampanhaResumo[]> {
      const { data } = await http.get<CampanhaResumo[]>('/api/campanhas')
      return data
    },

    async obter(id: number): Promise<CampanhaDetalhe> {
      const { data } = await http.get<CampanhaDetalhe>(`/api/campanhas/${id}`)
      return data
    },

    async salvar(
      chatId: string,
      nome: string,
      regraId: string,
      dadosExtras?: DadosSalvarCampanha,
    ): Promise<CampanhaResumo> {
      const { data } = await http.post<CampanhaResumo>('/api/campanhas', {
        chat_id: chatId,
        nome,
        rule_id: regraId,
        ...dadosExtras,
      })
      return data
    },

    async executarAcao(
      id: number,
      acao: AcaoCampanha,
      justificativa?: string,
    ): Promise<CampanhaResumo> {
      const { data } = await http.post<CampanhaResumo>(`/api/campanhas/${id}/acoes`, {
        acao,
        justificativa,
      })
      return data
    },
  }
}

export type ServicoCampanhas = ReturnType<typeof criarServicoCampanhas>

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const AGORA = new Date().toISOString()
const ONTEM = new Date(Date.now() - 86_400_000).toISOString()
const SEMANA = new Date(Date.now() - 7 * 86_400_000).toISOString()

const campanhaMock: CampanhaResumo[] = [
  {
    id: 1,
    nome: 'Black Friday 2025',
    status: 'RASCUNHO',
    versao_atual: 1,
    periodo_inicio: '2025-11-24',
    periodo_fim: '2025-11-30',
    custo_incremental: 23736.1,
    atualizada_em: AGORA,
    autor_nome: 'Você',
  },
  {
    id: 2,
    nome: 'Natal Premium',
    status: 'AGUARDANDO_APROVACAO',
    versao_atual: 2,
    periodo_inicio: '2025-12-20',
    periodo_fim: '2025-12-31',
    custo_incremental: 45200.0,
    atualizada_em: ONTEM,
    autor_nome: 'Você',
  },
  {
    id: 3,
    nome: 'Dia das Mães',
    status: 'APROVADA',
    versao_atual: 1,
    periodo_inicio: '2025-05-01',
    periodo_fim: '2025-05-11',
    custo_incremental: 18900.5,
    atualizada_em: SEMANA,
    autor_nome: 'Você',
  },
]

let proximoId = 4

const campanhaDetalheMock: Map<number, CampanhaDetalhe> = new Map([
  [
    1,
    {
      id: 1,
      nome: 'Black Friday 2025',
      status: 'RASCUNHO',
      versao_atual: 1,
      periodo_inicio: '2025-11-24',
      periodo_fim: '2025-11-30',
      custo_incremental: 23736.1,
      atualizada_em: AGORA,
      autor_nome: 'Você',
      autor_id: 1,
      rule_id: 'draft-1',
      chat_id: 'chat-mock-1',
      parametros: [],
      resultado_simulacao: resultadoBlackFridayMock(),
      versoes: [
        {
          versao: 1,
          status: 'RASCUNHO',
          criada_em: AGORA,
          decidida_em: null,
          decisao: null,
          justificativa: null,
        },
      ],
      mensagens: [
        {
          id: 1,
          papel: 'usuario',
          texto: 'Quero criar uma campanha de Black Friday com +1% para todas as marcas.',
          criada_em: AGORA,
        },
        {
          id: 2,
          papel: 'agente',
          texto: 'Entendi! Configurei os parâmetros da campanha Black Friday. Pode simular.',
          criada_em: AGORA,
        },
        {
          id: 3,
          papel: 'sistema',
          texto: 'Campanha "Black Friday 2025" salva como rascunho.',
          criada_em: AGORA,
        },
      ],
    },
  ],
  [
    2,
    {
      id: 2,
      nome: 'Natal Premium',
      status: 'AGUARDANDO_APROVACAO',
      versao_atual: 2,
      periodo_inicio: '2025-12-20',
      periodo_fim: '2025-12-31',
      custo_incremental: 45200.0,
      atualizada_em: ONTEM,
      autor_nome: 'Você',
      autor_id: 1,
      rule_id: 'draft-2',
      chat_id: 'chat-mock-2',
      parametros: [],
      resultado_simulacao: null,
      versoes: [
        {
          versao: 1,
          status: 'REPROVADA',
          criada_em: SEMANA,
          decidida_em: ONTEM,
          decisao: 'REPROVADA',
          justificativa: 'Orçamento excedido.',
        },
        {
          versao: 2,
          status: 'AGUARDANDO_APROVACAO',
          criada_em: ONTEM,
          decidida_em: null,
          decisao: null,
          justificativa: null,
        },
      ],
      mensagens: [
        {
          id: 1,
          papel: 'usuario',
          texto: 'Campanha de Natal para todas as lojas premium.',
          criada_em: SEMANA,
        },
      ],
    },
  ],
  [
    3,
    {
      id: 3,
      nome: 'Dia das Mães',
      status: 'APROVADA',
      versao_atual: 1,
      periodo_inicio: '2025-05-01',
      periodo_fim: '2025-05-11',
      custo_incremental: 18900.5,
      atualizada_em: SEMANA,
      autor_nome: 'Você',
      autor_id: 1,
      rule_id: 'draft-3',
      chat_id: 'chat-mock-3',
      parametros: [],
      resultado_simulacao: null,
      versoes: [
        {
          versao: 1,
          status: 'APROVADA',
          criada_em: SEMANA,
          decidida_em: SEMANA,
          decisao: 'APROVADA',
          justificativa: null,
        },
      ],
      mensagens: [],
    },
  ],
])

export function criarServicoCampanhasMock(): ServicoCampanhas {
  const lista: CampanhaResumo[] = [...campanhaMock]

  return {
    async listar(): Promise<CampanhaResumo[]> {
      await delay(300)
      return [...lista]
    },

    async obter(id: number): Promise<CampanhaDetalhe> {
      await delay(300)
      const detalhe = campanhaDetalheMock.get(id)
      if (!detalhe) throw new Error(`Campanha ${id} não encontrada.`)
      return { ...detalhe }
    },

    async salvar(
      chatId: string,
      nome: string,
      regraId: string,
      dadosExtras?: DadosSalvarCampanha,
    ): Promise<CampanhaResumo> {
      await delay(300)
      const isBlackFriday = nome.toLowerCase().includes('black friday')
      const nova: CampanhaResumo = {
        id: proximoId++,
        nome,
        status: 'RASCUNHO',
        versao_atual: 1,
        periodo_inicio: dadosExtras?.periodo_inicio || (isBlackFriday ? '2025-11-24' : ''),
        periodo_fim: dadosExtras?.periodo_fim || (isBlackFriday ? '2025-11-30' : ''),
        custo_incremental:
          dadosExtras?.custo_incremental !== undefined
            ? dadosExtras.custo_incremental
            : isBlackFriday
              ? 23736.1
              : null,
        atualizada_em: new Date().toISOString(),
        autor_nome: 'Você',
      }
      lista.unshift(nova)
      campanhaDetalheMock.set(nova.id, {
        ...nova,
        autor_id: 1,
        rule_id: regraId,
        chat_id: chatId,
        parametros: dadosExtras?.parametros ?? [],
        resultado_simulacao:
          dadosExtras?.resultado_simulacao ?? (isBlackFriday ? resultadoBlackFridayMock() : null),
        versoes: [
          {
            versao: 1,
            status: 'RASCUNHO',
            criada_em: nova.atualizada_em,
            decidida_em: null,
            decisao: null,
            justificativa: null,
          },
        ],
        mensagens: [
          {
            id: 1,
            papel: 'sistema',
            texto: `Campanha "${nome}" salva como rascunho.`,
            criada_em: nova.atualizada_em,
          },
        ],
      })
      return nova
    },

    async executarAcao(
      id: number,
      acao: AcaoCampanha,
      _justificativa?: string,
    ): Promise<CampanhaResumo> {
      await delay(300)
      const idx = lista.findIndex((c) => c.id === id)
      if (idx === -1) throw new Error(`Campanha ${id} não encontrada.`)

      const mapaStatus: Record<AcaoCampanha, StatusCampanha> = {
        simular: lista[idx]!.status,
        submeter: 'AGUARDANDO_APROVACAO',
        arquivar: 'ARQUIVADA',
        solicitar_cancelamento: 'ARQUIVADA',
        editar: 'RASCUNHO',
      }

      lista[idx] = {
        ...lista[idx]!,
        status: mapaStatus[acao],
        atualizada_em: new Date().toISOString(),
      }
      return lista[idx]!
    },
  }
}
