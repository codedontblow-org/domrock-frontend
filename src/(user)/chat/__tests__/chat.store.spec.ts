import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { AxiosError, AxiosHeaders } from 'axios'
import { definirServicoCampanha, definirServicoCampanhas, useChatStore } from '../stores/chat'
import { FakeServicoCampanhas, campanhaReprovada } from '../../campanhas/__tests__/fakes'
import { FakeServicoCampanha, regraBlackFriday, resultadoBlackFriday, resultadoDoCriterio } from './fakes'

function erroHttp(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('falhou', 'ERR', config, null, { status, statusText: '', data, headers: {}, config })
}

describe('useChatStore', () => {
  let servico: FakeServicoCampanha

  beforeEach(() => {
    setActivePinia(createPinia())
    servico = new FakeServicoCampanha()
    definirServicoCampanha(servico)
  })

  it('envia a mensagem, mostra a resposta da Lana e guarda a regra extraída', async () => {
    const chat = useChatStore()

    await chat.enviar('Black Friday +1%')

    expect(servico.conversas[0]?.mensagem).toBe('Black Friday +1%')
    expect(chat.mensagens.map((m) => m.papel)).toEqual(['usuario', 'agente'])
    expect(chat.regra?.rule_id).toBe('draft-1')
    expect(chat.podeSimular).toBe(true)
  })

  it('não deixa simular enquanto falta parâmetro obrigatório', async () => {
    servico.respostaChat = { chat_id: 'c', response: 'Qual o orçamento?', regra: regraBlackFriday({ orcamento_limite: null }) }
    const chat = useChatStore()

    await chat.enviar('Black Friday')
    await chat.simular()

    expect(chat.camposVazios).toEqual(['orcamento_limite'])
    expect(servico.simulacoes).toHaveLength(0)
  })

  it('simula com os valores editados pelo usuário', async () => {
    const chat = useChatStore()
    await chat.enviar('Black Friday')

    chat.atualizarParametro('pct_acrescimo', 2)
    await chat.simular()

    const pct = servico.simulacoes[0]?.parametros.find((p) => p.key === 'pct_acrescimo')
    expect(pct?.value).toBe(2)
    expect(chat.mensagens[chat.mensagens.length - 1]?.resultado?.totais.diferenca).toBe(23736.17)
  })

  it('aplica o cenário calculado no painel sem simular sozinho', async () => {
    const chat = useChatStore()
    await chat.enviar('Black Friday')
    const [cenario] = resultadoBlackFriday().cenarios

    chat.aplicarCenario(cenario!)

    const valor = (key: string) => chat.regra?.parametros.find((p) => p.key === key)?.value
    expect(valor('pct_acrescimo')).toBe(0.84)
    expect(valor('marcas_alvo')).toEqual(['10', '20', '30', '40', '50', '60'])
    expect(servico.simulacoes).toHaveLength(0)
  })

  it('mostra os erros de validação que o backend devolve', async () => {
    const chat = useChatStore()
    await chat.enviar('Black Friday')
    servico.falha = erroHttp(422, { etapa: 'validacao', mensagem: 'x', erros: ['orcamento_limite: obrigatório'] })

    await chat.simular()

    expect(chat.mensagens[chat.mensagens.length - 1]).toMatchObject({ papel: 'erro', texto: 'Revise a campanha: orcamento_limite: obrigatório' })
    expect(chat.simulando).toBe(false)
  })

  it('mostra a etapa que o backend manda enquanto simula e limpa ao terminar', async () => {
    const chat = useChatStore()
    await chat.enviar('Black Friday')
    servico.etapas = ['Na fila', 'Simulando']
    servico.segurarSimulacao = true

    const simulacao = chat.simular()
    expect(chat.etapaSimulacao).toBe('Simulando')

    servico.liberarSimulacao()
    await simulacao
    expect(chat.etapaSimulacao).toBeNull()
    expect(chat.simulando).toBe(false)
  })

  it('manda ao agente o painel com as edições do usuário', async () => {
    const chat = useChatStore()
    await chat.enviar('Black Friday')
    chat.atualizarParametro('pct_acrescimo', 2)

    await chat.enviar('só a marca 30')

    const pct = servico.conversas[1]?.regra?.parametros.find((p) => p.key === 'pct_acrescimo')
    expect(pct?.value).toBe(2)
  })

  it('ignora um segundo envio enquanto a Lana ainda responde', async () => {
    const chat = useChatStore()

    const primeiro = chat.enviar('um')
    await chat.enviar('dois')
    await primeiro

    expect(servico.conversas.map((c) => c.mensagem)).toEqual(['um'])
  })
})

describe('enviar para aprovação', () => {
  let servico: FakeServicoCampanha

  beforeEach(() => {
    setActivePinia(createPinia())
    servico = new FakeServicoCampanha()
    definirServicoCampanha(servico)
  })

  it('só libera depois de uma simulação concluída', async () => {
    const chat = useChatStore()
    await chat.enviar('Natal')

    expect(chat.etapaAprovacao).toBe('sem_simulacao')
    await chat.enviarParaAprovacao('Natal 2025')

    expect(servico.salvamentos).toHaveLength(0)
  })

  it('salva a campanha com a última simulação e a submete', async () => {
    const chat = useChatStore()
    await chat.enviar('Natal')
    await chat.simular()
    await chat.simular()

    await chat.enviarParaAprovacao('  Natal 2025 ')

    expect(servico.salvamentos).toEqual([{ chatId: chat.chatId, simulacaoId: 346, nome: 'Natal 2025' }])
    expect(servico.submissoes).toEqual([12])
    expect(chat.etapaAprovacao).toBe('enviada')
    expect(chat.mensagens[chat.mensagens.length - 1]?.texto).toContain('Aguardando Aprovação')
  })

  it('guarda a campanha que o submeter devolveu, para a barra mostrar nome, status e versão', async () => {
    const chat = useChatStore()
    await chat.enviar('Natal')
    await chat.simular()

    await chat.enviarParaAprovacao('Natal 2025')

    expect(chat.campanha).toEqual({ id: 12, nome: 'Natal 2025', status: 'AGUARDANDO_APROVACAO', versao_atual: 1 })
    chat.novaConversa()
    expect(chat.campanha).toBeNull()
  })

  it('pede nova simulação se o painel mudou depois de simular', async () => {
    const chat = useChatStore()
    await chat.enviar('Natal')
    await chat.simular()

    chat.atualizarParametro('pct_acrescimo', 2)
    await chat.enviarParaAprovacao('Natal 2025')

    expect(chat.etapaAprovacao).toBe('desatualizada')
    expect(servico.salvamentos).toHaveLength(0)
  })

  it('envia para aprovação mesmo quando o custo passa do orçamento', async () => {
    servico.resultado = resultadoBlackFriday(false)
    const chat = useChatStore()
    await chat.enviar('Natal')
    await chat.simular()
    expect(chat.etapaAprovacao).toBe('fora_do_orcamento')

    await chat.enviarParaAprovacao('Natal 2025')

    expect(servico.salvamentos).toHaveLength(1)
    expect(chat.etapaAprovacao).toBe('enviada')
  })

  it('sem orçamento, a simulação fica pronta para enviar, sem aviso de orçamento (A6-72)', async () => {
    servico.resultado = resultadoDoCriterio('sem_orcamento')
    const chat = useChatStore()
    await chat.enviar('Natal')

    await chat.simular()

    expect(chat.etapaAprovacao).toBe('pronta')
  })

  it('orçamento opcional vazio não conta como campo pendente', async () => {
    const regra = regraBlackFriday({ orcamento_limite: null })
    for (const p of regra.parametros) p.required = p.key !== 'orcamento_limite'
    servico.respostaChat = { chat_id: 'c', response: 'Anotado!', regra }
    const chat = useChatStore()

    await chat.enviar('Natal')

    expect(chat.camposVazios).toEqual([])
    expect(chat.podeSimular).toBe(true)
  })

  it('tira o aviso de orçamento quando a nova simulação cabe', async () => {
    servico.resultado = resultadoBlackFriday(false)
    const chat = useChatStore()
    await chat.enviar('Natal')
    await chat.simular()

    servico.resultado = resultadoBlackFriday(true)
    await chat.simular()

    expect(chat.etapaAprovacao).toBe('pronta')
  })

  it('se o submeter falha, a nova tentativa só submete a campanha já salva', async () => {
    const chat = useChatStore()
    await chat.enviar('Natal')
    await chat.simular()
    servico.falhaSubmeter = erroHttp(409, { message: 'Campanha em AGUARDANDO_APROVACAO' })

    await chat.enviarParaAprovacao('Natal 2025')
    expect(chat.mensagens[chat.mensagens.length - 1]).toMatchObject({ papel: 'erro', texto: 'Campanha em AGUARDANDO_APROVACAO' })
    expect(chat.etapaAprovacao).toBe('pronta')

    await chat.enviarParaAprovacao('Natal 2025')
    expect(servico.salvamentos).toHaveLength(1)
    expect(servico.submissoes).toEqual([12, 12])
    expect(chat.etapaAprovacao).toBe('enviada')
  })
})

describe('reabrir conversa da campanha no chat (A6-92)', () => {
  let servicoCampanha: FakeServicoCampanha
  let servicoCampanhas: FakeServicoCampanhas

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    servicoCampanha = new FakeServicoCampanha()
    servicoCampanhas = new FakeServicoCampanhas()
    definirServicoCampanha(servicoCampanha)
    definirServicoCampanhas(servicoCampanhas)
  })

  it('reabre pela campanha com mensagens em ordem, trilha convertida e ficha restaurada', async () => {
    const chat = useChatStore()
    servicoCampanhas.campanha = campanhaReprovada({
      id: 12,
      acoes: ['RENOMEAR', 'SUBMETER'],
      ultima_simulacao: {
        id: 345,
        regra: regraBlackFriday({ meta_vendas: 2_500_000 }),
        resultado: resultadoBlackFriday(),
        concluida_em: '2026-10-21T12:59:02Z',
      },
    })
    servicoCampanha.conversaGravada = {
      chat_id: 'chat-da-gabriela',
      campanha_id: 12,
      mensagens: [
        { id: 101, papel: 'usuario', texto: 'Quero +1%', criada_em: '2026-10-21T12:58:10Z' },
        {
          id: 102,
          papel: 'lana',
          texto: 'Preenchi a ficha',
          regra: regraBlackFriday(),
          trilha: {
            modelo: 'gemini-3.5-flash-lite',
            tentativas: null,
            premissas: [],
            passos: [
              {
                ordem: 1,
                ferramenta: 'consultar_banco',
                descricao: 'Consulta out/25',
                tabelas_acessadas: ['venda'],
                competencias: ['2025-10'],
                filtros: null,
                sql_executado: null,
                registros_retornados: 1,
                dados: [{ total: 100 }],
                tempo_ms: 200,
                situacao: 'SUCESSO',
                mensagem_erro: null,
              },
            ],
          },
          criada_em: '2026-10-21T12:58:14Z',
        },
        {
          id: 103,
          papel: 'sistema',
          tipo: 'SIMULACAO',
          texto: 'Simulação concluída: custo de R$ 23.736,10',
          simulacao_id: 345,
          criada_em: '2026-10-21T12:59:02Z',
        },
      ],
    }

    await chat.abrirCampanha(12)

    expect(chat.chatId).toBe('chat-da-gabriela')
    expect(chat.campanha?.id).toBe(12)
    expect(chat.mensagens).toHaveLength(3)
    expect(chat.mensagens[0]?.papel).toBe('usuario')
    expect(chat.mensagens[1]?.papel).toBe('agente')
    expect(chat.mensagens[1]?.events).toHaveLength(1)
    expect(chat.mensagens[2]?.papel).toBe('sistema')
    expect(chat.mensagens[2]?.resultado).toBeDefined()
    expect(chat.simulacaoId).toBe(345)
    expect(chat.regra?.parametros.find((p) => p.key === 'meta_vendas')?.value).toBe(2_500_000)
    expect(chat.cabeNoOrcamento).toBe(true)
    expect(chat.somenteLeitura).toBe(false)
  })

  it('controla somente leitura por acoes (RENOMEAR liberado, EDITAR com botão, vazio bloqueado)', async () => {
    const chat = useChatStore()

    // 1. EDITAR (campanha reprovada): somente leitura com botão de voltar
    servicoCampanhas.campanha = campanhaReprovada({ acoes: ['EDITAR', 'ARQUIVAR'] })
    await chat.abrirCampanha(12)
    expect(chat.somenteLeitura).toBe(true)
    expect(chat.podeVoltarRascunho).toBe(true)

    // 2. RENOMEAR (campanha rascunho): chat liberado
    servicoCampanhas.campanha = campanhaReprovada({ acoes: ['RENOMEAR', 'SUBMETER'] })
    await chat.abrirCampanha(12)
    expect(chat.somenteLeitura).toBe(false)
    expect(chat.podeVoltarRascunho).toBe(false)

    // 3. Vazio (supervisor ou outro status): somente leitura sem botão
    servicoCampanhas.campanha = campanhaReprovada({ acoes: [] })
    await chat.abrirCampanha(12)
    expect(chat.somenteLeitura).toBe(true)
    expect(chat.podeVoltarRascunho).toBe(false)
  })

  it('fluxo do botão Editar: chama POST .../editar, busca conversa de novo e libera o chat', async () => {
    const chat = useChatStore()
    servicoCampanhas.campanha = campanhaReprovada({ id: 12, acoes: ['EDITAR', 'ARQUIVAR'] })
    await chat.abrirCampanha(12)
    expect(chat.somenteLeitura).toBe(true)
    expect(chat.podeVoltarRascunho).toBe(true)

    servicoCampanha.conversaGravada = {
      chat_id: 'chat-da-gabriela',
      campanha_id: 12,
      mensagens: [
        { id: 101, papel: 'usuario', texto: 'Quero +1%', criada_em: '' },
        {
          id: 102,
          papel: 'sistema',
          tipo: 'STATUS',
          texto: 'Voltou para rascunho — a próxima submissão será a v2',
          criada_em: '',
        },
      ],
    }

    await chat.editarCampanhaReprovada()

    expect(servicoCampanhas.acoesFeitas).toContainEqual({ id: 12, acao: 'EDITAR' })
    expect(chat.somenteLeitura).toBe(false)
    expect(chat.podeVoltarRascunho).toBe(false)
    expect(chat.mensagens.some((m) => m.texto.includes('Voltou para rascunho'))).toBe(true)
  })

  it('duplo clique em Editar campanha dispara apenas uma chamada a agir (item B4)', async () => {
    const chat = useChatStore()
    servicoCampanhas.campanha = campanhaReprovada({ id: 12, acoes: ['EDITAR', 'ARQUIVAR'] })
    await chat.abrirCampanha(12)

    let resolverAgir: (() => void) | null = null
    const promessaAgir = new Promise<void>((r) => { resolverAgir = r })
    const agirOriginal = servicoCampanhas.agir.bind(servicoCampanhas)
    servicoCampanhas.agir = async (id, acao) => {
      await promessaAgir
      return agirOriginal(id, acao)
    }

    const primeira = chat.editarCampanhaReprovada()
    const segunda = chat.editarCampanhaReprovada()
    expect(chat.editandoCampanha).toBe(true)

    resolverAgir!()
    await Promise.all([primeira, segunda])

    expect(servicoCampanhas.acoesFeitas).toHaveLength(1)
    expect(chat.editandoCampanha).toBe(false)
  })

  it('insere mensagens_sistema do POST /api/chat antes da resposta da Lana sem duplicar SIMULACAO', async () => {
    const chat = useChatStore()
    chat.regra = regraBlackFriday()

    // Simula uma vez ao vivo (gera resultado com id 345)
    await chat.simular()
    expect(chat.mensagens[chat.mensagens.length - 1]?.simulacao_id).toBe(345)

    // Backend manda mensagens de sistema no POST /api/chat, incluindo a simulação 345 já feita e um STATUS
    servicoCampanha.respostaChat = {
      chat_id: chat.chatId,
      response: 'Aqui está a resposta!',
      regra: null,
      mensagens_sistema: [
        {
          id: 201,
          papel: 'sistema',
          tipo: 'STATUS',
          texto: 'Reprovado por Sérgio: meta baixa',
          criada_em: '2026-10-21T14:20:00Z',
        },
        {
          id: 202,
          papel: 'sistema',
          tipo: 'SIMULACAO',
          texto: 'Simulação concluída',
          simulacao_id: 345,
          criada_em: '2026-10-21T12:59:02Z',
        },
      ],
    }

    await chat.enviar('Ajustei a meta')

    const textos = chat.mensagens.map((m) => m.texto)
    const idxStatus = textos.findIndex((t) => t.includes('Reprovado por Sérgio'))
    const idxResposta = textos.findIndex((t) => t === 'Aqui está a resposta!')

    expect(idxStatus).toBeGreaterThan(-1)
    expect(idxResposta).toBeGreaterThan(idxStatus)
    // A simulação 345 não deve ser duplicada
    const simulacoes345 = chat.mensagens.filter((m) => m.simulacao_id === 345)
    expect(simulacoes345).toHaveLength(1)
  })

  it('conversa reaberta não repete as mensagens de sistema que voltam em mensagens_sistema', async () => {
    const chat = useChatStore()
    const reprovacao = {
      id: 7, papel: 'sistema' as const, tipo: 'STATUS' as const,
      texto: 'Reprovado por Sérgio: custo alto', criada_em: '2026-10-28T02:19:00Z',
    }
    servicoCampanhas.campanha = campanhaReprovada({ id: 12, acoes: ['RENOMEAR'] })
    servicoCampanha.conversaGravada = {
      chat_id: 'chat-12',
      campanha_id: 12,
      mensagens: [{ id: 6, papel: 'usuario', texto: 'Oi Lana', criada_em: '' }, reprovacao],
    }
    await chat.abrirCampanha(12)
    servicoCampanha.respostaChat = {
      chat_id: 'chat-12', response: 'Certo!', regra: null, events: [], mensagens_sistema: [reprovacao],
    }

    await chat.enviar('Vamos ajustar')

    expect(chat.mensagens.filter((m) => m.texto === reprovacao.texto)).toHaveLength(1)
    expect(chat.mensagens[chat.mensagens.length - 1]?.texto).toBe('Certo!')
  })

  it('F5 reabre conversa com chat_id guardado no localStorage', async () => {
    const chat = useChatStore()
    localStorage.setItem('chat_id', 'chat-persistido')

    servicoCampanha.conversaGravada = {
      chat_id: 'chat-persistido',
      campanha_id: null,
      mensagens: [
        { id: 1, papel: 'usuario', texto: 'Oi Lana', criada_em: '' },
        {
          id: 2,
          papel: 'sistema',
          tipo: 'SIMULACAO',
          simulacao_id: 345,
          texto: 'Simulação',
          criada_em: '',
        },
      ],
    }

    await chat.restaurarSessaoSeVazio()

    expect(chat.chatId).toBe('chat-persistido')
    expect(chat.mensagens).toHaveLength(2)
    expect(chat.simulacaoId).toBe(345)
    expect(chat.cabeNoOrcamento).toBe(true)
  })

  it('F5 em conversa que virou campanha reabre a campanha e mantém o chat_id guardado para o próximo F5', async () => {
    const chat = useChatStore()
    localStorage.setItem('chat_id', 'chat-12')
    servicoCampanhas.campanha = campanhaReprovada({ id: 12, chat_id: 'chat-12', acoes: [] })
    servicoCampanha.conversaGravada = {
      chat_id: 'chat-12',
      campanha_id: 12,
      mensagens: [{ id: 1, papel: 'usuario', texto: 'Oi Lana', criada_em: '' }],
    }

    await chat.restaurarSessaoSeVazio()

    expect(chat.campanha?.id).toBe(12)
    expect(chat.somenteLeitura).toBe(true)
    expect(chat.abertaPelaCampanha).toBe(false)
    expect(localStorage.getItem('chat_id')).toBe('chat-12')
  })

  it.each([404, 403])('F5 em conversa inexistente ou sem acesso (%i) gera nova conversa (item B9)', async (status) => {
    const chat = useChatStore()
    localStorage.setItem('chat_id', 'chat-inexistente')
    servicoCampanha.falhaBuscarMensagens = erroHttp(status, { message: 'Sem acesso ou não encontrado' })

    await chat.restaurarSessaoSeVazio()

    expect(chat.chatId).not.toBe('chat-inexistente')
    expect(localStorage.getItem('chat_id')).toBeNull()
  })

  it('navegação interna não refaz a busca se a store já tiver mensagens', async () => {
    const chat = useChatStore()
    chat.mensagens = [{ id: 1, chave: 'l-1', papel: 'usuario', texto: 'Em memória' }]
    localStorage.setItem('chat_id', 'chat-qualquer')

    await chat.restaurarSessaoSeVazio()

    expect(servicoCampanha.chatsConsultados).toHaveLength(0)
    expect(chat.mensagens[0]?.texto).toBe('Em memória')
  })

  it('novaConversa limpa o chat_id guardado no localStorage (item B10)', () => {
    const chat = useChatStore()
    localStorage.setItem('chat_id', 'chat-123')
    expect(localStorage.getItem('chat_id')).toBe('chat-123')

    chat.novaConversa()

    expect(localStorage.getItem('chat_id')).toBeNull()
  })

  it('conversa reaberta com ids 1 e 2 + nova mensagem local recebem chaves distintas (item B2)', async () => {
    const chat = useChatStore()
    servicoCampanhas.campanha = campanhaReprovada({ id: 12, acoes: ['RENOMEAR'] })
    servicoCampanha.conversaGravada = {
      chat_id: 'chat-12',
      campanha_id: 12,
      mensagens: [
        { id: 1, papel: 'usuario', texto: 'Mensagem 1', criada_em: '' },
        { id: 2, papel: 'lana', texto: 'Mensagem 2', criada_em: '' },
      ],
    }

    await chat.abrirCampanha(12)
    await chat.enviar('Mensagem 3')

    const chaves = chat.mensagens.map((m) => m.chave)
    expect(chaves).toHaveLength(4)
    expect(chaves[0]).toBe('b-1')
    expect(chaves[1]).toBe('b-2')
    expect(chaves[2]).toBe('l-1')
    expect(chaves[3]).toBe('l-2')
    expect(new Set(chaves).size).toBe(4)
  })

  it('corrida: resposta atrasada da Lana após novaConversa é descartada e mantém estado destravado (item B1)', async () => {
    const chat = useChatStore()
    servicoCampanha.segurarConversar = true
    servicoCampanha.respostaChat = {
      chat_id: chat.chatId,
      response: 'Resposta atrasada da Lana',
      regra: null,
    }

    const envio = chat.enviar('Mensagem lenta')
    expect(chat.aguardandoLana).toBe(true)

    chat.novaConversa()
    expect(chat.mensagens).toHaveLength(0)
    expect(chat.aguardandoLana).toBe(false)

    servicoCampanha.liberarConversar!()
    await envio

    expect(chat.mensagens).toHaveLength(0)
    expect(chat.aguardandoLana).toBe(false)
  })

  it('corrida: abrirCampanha(12) lento seguido de abrirCampanha(14) rápido mantém a 14 (item B1)', async () => {
    const chat = useChatStore()

    let resolver12: (() => void) | null = null
    const promessa12 = new Promise<void>((r) => { resolver12 = r })

    servicoCampanhas.abrir = async (id: number) => {
      if (id === 12) await promessa12
      return campanhaReprovada({ id, nome: `Campanha ${id}` })
    }
    servicoCampanha.buscarMensagens = async (chatId: string) => ({
      chat_id: chatId,
      campanha_id: Number(chatId.replace(/\D/g, '')) || 0,
      mensagens: [],
    })

    const abrir12 = chat.abrirCampanha(12)
    const abrir14 = chat.abrirCampanha(14)
    await abrir14

    expect(chat.campanha?.id).toBe(14)

    resolver12!()
    await abrir12

    expect(chat.campanha?.id).toBe(14)
  })

  it('carregarResultadoSimulacao mantém simulacao_id em simulacoesCarregando até terminar (item B6)', async () => {
    const chat = useChatStore()
    chat.mensagens = [
      { id: 10, chave: 'b-10', papel: 'sistema', tipo: 'SIMULACAO', simulacao_id: 345, texto: 'Simulação' },
    ]

    let resolverBusca: (() => void) | null = null
    const promessaBusca = new Promise<void>((r) => { resolverBusca = r })
    const buscarOriginal = servicoCampanha.buscarSimulacao.bind(servicoCampanha)
    servicoCampanha.buscarSimulacao = async (id: number) => {
      await promessaBusca
      return buscarOriginal(id)
    }

    const busca = chat.carregarResultadoSimulacao(345)
    expect(chat.simulacoesCarregando).toContain(345)

    resolverBusca!()
    await busca

    expect(chat.simulacoesCarregando).not.toContain(345)
    expect(chat.mensagens[0]?.resultado).toBeDefined()
  })
})
