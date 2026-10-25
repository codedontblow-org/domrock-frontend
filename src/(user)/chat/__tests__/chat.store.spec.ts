import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { AxiosError, AxiosHeaders } from 'axios'
import { definirServicoCampanha, useChatStore } from '../stores/chat'
import { FakeServicoCampanha, regraBlackFriday, resultadoBlackFriday } from './fakes'

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

  it('pede nova simulação se o painel mudou depois de simular', async () => {
    const chat = useChatStore()
    await chat.enviar('Natal')
    await chat.simular()

    chat.atualizarParametro('pct_acrescimo', 2)
    await chat.enviarParaAprovacao('Natal 2025')

    expect(chat.etapaAprovacao).toBe('desatualizada')
    expect(servico.salvamentos).toHaveLength(0)
  })

  it('não envia campanha que passa do orçamento', async () => {
    servico.resultado = resultadoBlackFriday(false)
    const chat = useChatStore()
    await chat.enviar('Natal')
    await chat.simular()

    await chat.enviarParaAprovacao('Natal 2025')

    expect(chat.etapaAprovacao).toBe('fora_do_orcamento')
    expect(servico.salvamentos).toHaveLength(0)
  })

  it('libera o envio quando a nova simulação cabe no orçamento', async () => {
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

describe('abrir a conversa de uma simulação (link do painel de aprovação)', () => {
  let servico: FakeServicoCampanha

  beforeEach(() => {
    setActivePinia(createPinia())
    servico = new FakeServicoCampanha()
    definirServicoCampanha(servico)
  })

  it('mostra o pedido, a ficha e o resultado da simulação, só para consulta', async () => {
    const chat = useChatStore()

    await chat.abrirSimulacao(345)

    expect(chat.chatId).toBe('chat-da-gabriela')
    expect(chat.regra?.rule_id).toBe('draft-1')
    expect(chat.mensagens.map((m) => m.papel)).toEqual(['usuario', 'resultado'])
    expect(chat.etapaAprovacao).toBe('somente_leitura')
    expect(chat.podeSimular).toBe(false)

    await chat.enviar('mudar')
    chat.atualizarParametro('pct_acrescimo', 5)
    expect(servico.conversas).toHaveLength(0)
    expect(chat.regra?.parametros.find((p) => p.key === 'pct_acrescimo')?.value).toBe(1)
  })

  it('nova conversa sai do modo consulta', async () => {
    const chat = useChatStore()
    await chat.abrirSimulacao(345)

    chat.novaConversa()

    expect(chat.mensagens).toHaveLength(0)
    expect(chat.etapaAprovacao).toBe('sem_simulacao')
    expect(chat.chatId).not.toBe('chat-da-gabriela')
  })
})
