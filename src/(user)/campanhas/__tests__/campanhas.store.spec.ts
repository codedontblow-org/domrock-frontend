import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { definirServicoCampanhas, useCampanhasStore } from '../stores/campanhas'
import { erroDoBackend, FakeServicoCampanhas, resumoBlackFriday } from './fakes'

describe('useCampanhasStore', () => {
  let servico: FakeServicoCampanhas

  beforeEach(() => {
    setActivePinia(createPinia())
    servico = new FakeServicoCampanhas()
    definirServicoCampanhas(servico)
  })

  it('sem filtro pede as minhas sem status: o backend já tira as arquivadas (contrato 5.4)', async () => {
    const store = useCampanhasStore()

    await store.listar()

    expect(servico.filtrosPedidos).toEqual([undefined])
    expect(store.campanhas).toHaveLength(1)
  })

  it('a aba escolhida vai como filtro para o backend', async () => {
    servico.lista = [resumoBlackFriday(), resumoBlackFriday({ id: 13, status: 'ARQUIVADA' })]
    const store = useCampanhasStore()

    await store.filtrar('ARQUIVADA')

    expect(servico.filtrosPedidos).toEqual(['ARQUIVADA'])
    expect(store.filtroStatus).toBe('ARQUIVADA')
    expect(store.campanhas.map((c) => c.id)).toEqual([13])
  })

  it('abre a campanha pelo id', async () => {
    const store = useCampanhasStore()

    await store.obter(12)

    expect(store.campanhaAtual?.nome).toBe('Black Friday 2025')
    expect(store.campanhaAtual?.acoes).toEqual(['EDITAR', 'ARQUIVAR'])
  })

  it('a campanha devolvida pela ação substitui a da tela', async () => {
    const store = useCampanhasStore()
    await store.obter(12)

    await store.agir(12, 'EDITAR')

    expect(servico.acoesFeitas).toEqual([{ id: 12, acao: 'EDITAR' }])
    expect(store.campanhaAtual?.status).toBe('RASCUNHO')
    expect(store.campanhaAtual?.acoes).toEqual(['RENOMEAR', 'SUBMETER', 'ARQUIVAR'])
  })

  it('renomeia pelo PUT e mostra o nome novo', async () => {
    const store = useCampanhasStore()
    await store.obter(12)

    await store.renomear(12, 'Black Friday 2025 - sem gerentes')

    expect(servico.nomesPedidos).toEqual(['Black Friday 2025 - sem gerentes'])
    expect(store.campanhaAtual?.nome).toBe('Black Friday 2025 - sem gerentes')
  })

  it('a recusa do backend vira `erro` com a mensagem dele, e a campanha da tela fica', async () => {
    const store = useCampanhasStore()
    await store.obter(12)
    servico.falha = erroDoBackend(409, 'Transição inválida: campanha 12 está em REPROVADA')

    await store.agir(12, 'ARQUIVAR')

    expect(store.erro).toBe('Transição inválida: campanha 12 está em REPROVADA')
    expect(store.campanhaAtual?.status).toBe('REPROVADA')
    expect(store.agindo).toBe(false)
  })

  it('falha ao listar vira `erro`', async () => {
    servico.falha = erroDoBackend(403, 'Sem permissão')
    const store = useCampanhasStore()

    await store.listar()

    expect(store.erro).toBe('Sem permissão')
    expect(store.carregando).toBe(false)
  })
})
