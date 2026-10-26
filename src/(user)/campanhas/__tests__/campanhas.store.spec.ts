import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { definirServicoCampanhas, useCampanhasStore } from '../stores/campanhas'
import type { AcaoCampanha, CampanhaDetalhe, CampanhaResumo, StatusCampanha } from '../types'
import type { ServicoCampanhas } from '../services/campanhas'

function campanhaMock(sobrescrever: Partial<CampanhaResumo> = {}): CampanhaResumo {
  return {
    id: 1,
    nome: 'Black Friday',
    status: 'RASCUNHO',
    versao_atual: 1,
    periodo_inicio: '2025-11-24',
    periodo_fim: '2025-11-30',
    custo_incremental: 23736.1,
    atualizada_em: new Date().toISOString(),
    autor_nome: 'Você',
    ...sobrescrever,
  }
}

class FakeServicoCampanhas implements ServicoCampanhas {
  lista: CampanhaResumo[] = [
    campanhaMock({ id: 1, status: 'RASCUNHO' }),
    campanhaMock({ id: 2, status: 'APROVADA', nome: 'Natal' }),
    campanhaMock({ id: 3, status: 'ARQUIVADA', nome: 'Páscoa' }),
  ]

  async listar(): Promise<CampanhaResumo[]> {
    return [...this.lista]
  }

  async obter(id: number): Promise<CampanhaDetalhe> {
    const c = this.lista.find((x) => x.id === id)
    if (!c) throw new Error('Não encontrada')
    return { ...c, autor_id: 1, rule_id: 'r1', chat_id: 'c1', parametros: [], resultado_simulacao: null, versoes: [], mensagens: [] }
  }

  async salvar(_chatId: string, nome: string, _regraId: string): Promise<CampanhaResumo> {
    const nova = campanhaMock({ id: 99, nome, status: 'RASCUNHO' })
    this.lista.push(nova)
    return nova
  }

  async executarAcao(id: number, acao: AcaoCampanha): Promise<CampanhaResumo> {
    const mapaStatus: Record<AcaoCampanha, StatusCampanha> = {
      simular: 'RASCUNHO',
      submeter: 'AGUARDANDO_APROVACAO',
      arquivar: 'ARQUIVADA',
      solicitar_cancelamento: 'ARQUIVADA',
      editar: 'RASCUNHO',
    }
    const idx = this.lista.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Não encontrada')
    this.lista[idx] = { ...this.lista[idx]!, status: mapaStatus[acao] }
    return this.lista[idx]!
  }
}

describe('useCampanhasStore', () => {
  let servico: FakeServicoCampanhas

  beforeEach(() => {
    setActivePinia(createPinia())
    servico = new FakeServicoCampanhas()
    definirServicoCampanhas(servico)
  })

  it('listar carrega as campanhas', async () => {
    const store = useCampanhasStore()
    await store.listar()
    expect(store.campanhas).toHaveLength(3)
    expect(store.campanhas[0]?.nome).toBe('Black Friday')
  })

  it('filtroStatus TODOS retorna todas as campanhas', async () => {
    const store = useCampanhasStore()
    await store.listar()
    store.filtroStatus = 'TODOS'
    expect(store.campanhsFiltradas).toHaveLength(3)
  })

  it('filtroStatus APROVADA retorna só aprovadas', async () => {
    const store = useCampanhasStore()
    await store.listar()
    store.filtroStatus = 'APROVADA'
    expect(store.campanhsFiltradas).toHaveLength(1)
    expect(store.campanhsFiltradas[0]?.nome).toBe('Natal')
  })

  it('filtroStatus ARQUIVADA filtra corretamente', async () => {
    const store = useCampanhasStore()
    await store.listar()
    store.filtroStatus = 'ARQUIVADA'
    expect(store.campanhsFiltradas).toHaveLength(1)
    expect(store.campanhsFiltradas[0]?.nome).toBe('Páscoa')
  })

  it('executarAcao submeter muda o status da campanha na lista', async () => {
    const store = useCampanhasStore()
    await store.listar()
    await store.executarAcao(1, 'submeter')
    const atualizada = store.campanhas.find((c) => c.id === 1)
    expect(atualizada?.status).toBe('AGUARDANDO_APROVACAO')
  })

  it('salvar adiciona a campanha ao início da lista', async () => {
    const store = useCampanhasStore()
    await store.listar()
    const tamanhoOriginal = store.campanhas.length
    await store.salvar('chat-1', 'Nova Campanha', 'rule-1')
    expect(store.campanhas).toHaveLength(tamanhoOriginal + 1)
    expect(store.campanhas[0]?.nome).toBe('Nova Campanha')
  })

  it('obter preenche campanhaAtual', async () => {
    const store = useCampanhasStore()
    await store.listar()
    await store.obter(1)
    expect(store.campanhaAtual?.nome).toBe('Black Friday')
  })
})
