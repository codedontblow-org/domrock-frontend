import { AxiosError, AxiosHeaders } from 'axios'
import { regraBlackFriday, resultadoBlackFriday } from '../../chat/__tests__/fakes'
import type { AcaoSemCorpo, ServicoCampanhas } from '../../campanha/services/campanhas'
import type {
  CampanhaAprovada, CampanhaDetalhe, CampanhaResumo, FilaCampanha, StatusCampanha, VersaoCampanha,
} from '../../campanha/types'
import type { SimulacaoConcluida } from '../../chat/types'

/** Item de GET /api/campanhas/minhas (contrato 5.4), com os números do card A6-67. */
export function resumoBlackFriday(sobrescrever: Partial<CampanhaResumo> = {}): CampanhaResumo {
  return {
    id: 12,
    nome: 'Black Friday 2025',
    status: 'RASCUNHO',
    vigencia: null,
    em_simulacao: false,
    versao_atual: null,
    periodo: { data_inicio: '2025-11-24', data_fim: '2025-11-30' },
    custo_adicional: 23736.1,
    atualizada_em: '2026-10-21T13:00:12Z',
    ...sobrescrever,
  }
}

/** Campanha (contrato 5.2) com a v1 reprovada, vista pela autora. */
export function campanhaReprovada(sobrescrever: Partial<CampanhaDetalhe> = {}): CampanhaDetalhe {
  return {
    id: 12,
    nome: 'Black Friday 2025',
    status: 'REPROVADA',
    vigencia: null,
    em_simulacao: false,
    acoes: ['EDITAR', 'ARQUIVAR'],
    autor: { id: 1, nome: 'Gabriela' },
    chat_id: 'chat-da-gabriela',
    periodo: { data_inicio: '2025-11-24', data_fim: '2025-11-30' },
    versao_atual: 1,
    ultima_simulacao: {
      id: 345,
      regra: regraBlackFriday(),
      resultado: resultadoBlackFriday(),
      concluida_em: '2026-10-21T12:59:02Z',
    },
    versoes: [{
      numero: 1,
      status: 'REPROVADA',
      submetida_em: '2026-10-21T13:05:00Z',
      decisao: {
        decisao: 'REPROVADA',
        por: { id: 2, nome: 'Sérgio' },
        em: '2026-10-21T14:20:00Z',
        justificativa: 'a meta de R$ 2 milhões está abaixo da venda real do período',
      },
    }],
    criada_em: '2026-10-21T13:00:12Z',
    atualizada_em: '2026-10-21T14:20:00Z',
    ...sobrescrever,
  }
}

/** Resposta de erro do backend no formato de "Formato de erro" do contrato. */
export function erroDoBackend(status: number, message: string): AxiosError {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('falhou', 'ERR', config, null, { status, statusText: '', data: { message }, headers: {}, config })
}

/** Backend de campanhas em memória: guarda o que a tela pediu para os testes conferirem. */
export class FakeServicoCampanhas implements ServicoCampanhas {
  lista: CampanhaResumo[] = [resumoBlackFriday()]
  campanha: CampanhaDetalhe = campanhaReprovada()
  filtrosPedidos: (StatusCampanha | undefined)[] = []
  acoesFeitas: { id: number; acao: AcaoSemCorpo }[] = []
  nomesPedidos: string[] = []
  falha: Error | null = null

  async minhas(status?: StatusCampanha): Promise<CampanhaResumo[]> {
    this.filtrosPedidos.push(status)
    if (this.falha) throw this.falha
    return this.lista.filter((item) => status === undefined || item.status === status)
  }

  async abrir(id: number): Promise<CampanhaDetalhe> {
    if (this.falha) throw this.falha
    return { ...this.campanha, id }
  }

  async agir(id: number, acao: AcaoSemCorpo): Promise<CampanhaDetalhe> {
    this.acoesFeitas.push({ id, acao })
    if (this.falha) throw this.falha
    return { ...this.campanha, id, status: 'RASCUNHO', acoes: ['RENOMEAR', 'SUBMETER', 'ARQUIVAR'] }
  }

  async renomear(id: number, nome: string): Promise<CampanhaDetalhe> {
    this.nomesPedidos.push(nome)
    if (this.falha) throw this.falha
    return { ...this.campanha, id, nome }
  }

  async fila(): Promise<FilaCampanha[]> {
    throw new Error('fila não é usada em Minhas campanhas')
  }

  async aprovadas(): Promise<CampanhaAprovada[]> {
    throw new Error('aprovadas não é usada em Minhas campanhas')
  }

  async versao(): Promise<VersaoCampanha> {
    throw new Error('versao não é usada em Minhas campanhas')
  }

  async decidir(): Promise<void> {
    throw new Error('decidir não é usada em Minhas campanhas')
  }

  async resimular(): Promise<SimulacaoConcluida> {
    throw new Error('resimular não é usada em Minhas campanhas')
  }
}
