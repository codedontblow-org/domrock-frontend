import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { AxiosError, AxiosHeaders } from 'axios'
import { definirServicoCampanha, useChatStore } from '../stores/chat'
import { FakeServicoCampanha, regraBlackFriday } from './fakes'

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

  it('mostra os erros de validação que o backend devolve', async () => {
    const chat = useChatStore()
    await chat.enviar('Black Friday')
    servico.falha = erroHttp(422, { etapa: 'validacao', mensagem: 'x', erros: ['orcamento_limite: obrigatório'] })

    await chat.simular()

    expect(chat.mensagens[chat.mensagens.length - 1]).toMatchObject({ papel: 'erro', texto: 'Revise a campanha: orcamento_limite: obrigatório' })
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
