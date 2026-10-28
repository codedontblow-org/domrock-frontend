import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { AxiosError, AxiosHeaders } from 'axios'
import AvisoConflitos from '../components/AvisoConflitos.vue'
import ChatHeader from '../components/ChatHeader.vue'
import ComissaoPeriodo from '../components/ComissaoPeriodo.vue'
import { dataLocal, formatarPercentualFixo, formatarTrecho } from '../formatacao'
import { definirServicoCampanha, useChatStore } from '../stores/chat'
import type { ComissaoNoTrecho, ConflitoCampanha } from '../types'
import { exemplo2Contrato, exemplo3Contrato, FakeServicoCampanha } from './fakes'

describe('Formatador de trecho, percentual e data local', () => {
  it('formata trecho de um dia mostrando apenas o dia e mês', () => {
    expect(formatarTrecho('2025-11-24', '2025-11-24')).toBe('24/11')
  })

  it('formata trecho do mesmo mês com início e fim', () => {
    expect(formatarTrecho('2025-11-25', '2025-11-30')).toBe('25 a 30/11')
  })

  it('formata trecho de meses diferentes com dias e meses', () => {
    expect(formatarTrecho('2025-11-25', '2025-12-05')).toBe('25/11 a 05/12')
  })

  it('retorna a data local sem salto de fuso UTC', () => {
    const data = new Date(2025, 10, 24, 23, 30) // 24/11 às 23:30 local
    expect(dataLocal(data)).toBe('24/11/2025')
  })

  it('formata percentual com exatamente duas casas decimais', () => {
    expect(formatarPercentualFixo(1)).toBe('1,00%')
    expect(formatarPercentualFixo(2.5)).toBe('2,50%')
    expect(formatarPercentualFixo(3.5)).toBe('3,50%')
  })
})

describe('Tabela de comissão no período (ComissaoPeriodo)', () => {
  it('exibe os trechos do Exemplo 2 com rótulos, históricos e sem linhas nulas de aprovação', () => {
    const dados = exemplo2Contrato()
    const wrapper = mount(ComissaoPeriodo, { props: { linhas: dados.comissao_periodo } })

    const linhas = wrapper.findAll('tbody tr')
    expect(linhas).toHaveLength(2)

    // Trecho 1: 24/11, 2,50% vigente e 3,00% com a campanha (trecho e percentual em duas linhas)
    const primeiroTrecho = linhas[0]!.text()
    expect(primeiroTrecho).toContain('Preto')
    expect(primeiroTrecho).toContain('Gerente (150)')
    expect(primeiroTrecho).toContain('1,00%')
    expect(primeiroTrecho).toContain('24/11:')
    expect(primeiroTrecho).toContain('2,50%')
    expect(primeiroTrecho).toContain('3,00%')
    expect(primeiroTrecho).toContain('2 campanhas')

    // Trecho 2: 25 a 30/11, 3,00% vigente e 3,50% com a campanha
    const segundoTrecho = linhas[1]!.text()
    expect(segundoTrecho).toContain('25 a 30/11:')
    expect(segundoTrecho).toContain('3,00%')
    expect(segundoTrecho).toContain('3,50%')
    expect(segundoTrecho).toContain('3 campanhas')

    // Verificação de acessibilidade e quebra de linhas nas colunas de comissão
    const celulasComissao = wrapper.findAll('td.col-comissao')
    expect(celulasComissao[0]!.find('.celula-trecho').text()).toBe('24/11:')
    expect(celulasComissao[0]!.find('.celula-pct').text()).toBe('2,50%')
    expect(celulasComissao[0]!.attributes('aria-label')).toBe('24/11: 2,50%')
    expect(celulasComissao[1]!.attributes('aria-label')).toBe('24/11: 3,00%')

    // Campanha da especificação (item 5g): autor e aprovador nulos não devem renderizar a linha "Sugerida por"
    const details = wrapper.findAll('details')
    const itemEspecificacao = details[0]!.findAll('article')[0]!
    expect(itemEspecificacao.text()).toContain('Especificação nov/25, item 5g')
    expect(itemEspecificacao.find('.historico-aprovacao').exists()).toBe(false)

    // Campanha com autor e aprovador preenchidos
    const itemComAutor = details[0]!.findAll('article')[1]!
    expect(itemComAutor.text()).toContain('Sugerida por Gabriela, aprovada por Sérgio')
  })

  it('exibe substituição com "Substituição: passa a ..." conforme o Exemplo 3', () => {
    const dados = exemplo3Contrato()
    const wrapper = mount(ComissaoPeriodo, { props: { linhas: dados.comissao_periodo } })

    expect(wrapper.text()).toContain('Substituição: passa a 3,00%')
    expect(wrapper.text()).toContain('Vendedor loja (100)')
    expect(wrapper.text()).toContain('1 campanha')
  })

  it('sem campanhas no período: vigente igual à base e exibe "Nenhuma"', () => {
    const semCampanhas: ComissaoNoTrecho[] = [
      {
        marca: '10',
        cargo: '150',
        data_inicio: '2025-11-24',
        data_fim: '2025-11-24',
        pct_base: 1.0,
        pct_vigente: 1.0,
        pct_com_campanha: 1.5,
        historico: [],
      },
    ]

    const wrapper = mount(ComissaoPeriodo, { props: { linhas: semCampanhas } })
    expect(wrapper.text()).toContain('1,00%')
    expect(wrapper.text()).toContain('Nenhuma')
    expect(wrapper.find('details').exists()).toBe(false)
  })

  it('não renderiza a tabela quando linhas está ausente ou vazio', () => {
    expect(mount(ComissaoPeriodo, { props: { linhas: [] } }).find('table').exists()).toBe(false)
    expect(mount(ComissaoPeriodo, { props: { linhas: undefined } }).find('table').exists()).toBe(false)
  })

  it('exibe apenas "Substituição" ou "Acréscimo" quando os percentuais forem nulos', () => {
    const linhasComNulos: ComissaoNoTrecho[] = [
      {
        marca: '10',
        cargo: '150',
        data_inicio: '2025-11-24',
        data_fim: '2025-11-24',
        pct_base: 1.0,
        pct_vigente: 1.0,
        pct_com_campanha: 1.0,
        historico: [
          {
            campanha_id: 1,
            versao: 1,
            tipo: 'SUBSTITUICAO',
            nome: 'Substituição Sem Pct',
            data_inicio: '2025-11-24',
            data_fim: '2025-11-24',
            pct_acrescimo: null,
            pct_novo: null,
            autor: null,
            aprovador: null,
            aprovada_em: null,
            justificativa: '',
          },
          {
            campanha_id: 2,
            versao: 1,
            tipo: 'ACRESCIMO',
            nome: 'Acréscimo Sem Pct',
            data_inicio: '2025-11-24',
            data_fim: '2025-11-24',
            pct_acrescimo: null,
            pct_novo: null,
            autor: null,
            aprovador: null,
            aprovada_em: null,
            justificativa: '',
          },
        ],
      },
    ]

    const wrapper = mount(ComissaoPeriodo, { props: { linhas: linhasComNulos } })
    const efeitos = wrapper.findAll('.historico-efeito')
    expect(efeitos[0]!.text()).toBe('Substituição')
    expect(efeitos[1]!.text()).toBe('Acréscimo')
    expect(wrapper.text()).not.toContain('passa a 0,00%')
    expect(wrapper.text()).not.toContain('+0,00%')
  })

  it('exibe a linha de aprovação apenas quando autor, aprovador e aprovada_em estão todos preenchidos', () => {
    const linhasAprovacao: ComissaoNoTrecho[] = [
      {
        marca: '10',
        cargo: '150',
        data_inicio: '2025-11-24',
        data_fim: '2025-11-24',
        pct_base: 1.0,
        pct_vigente: 1.0,
        pct_com_campanha: 1.0,
        historico: [
          {
            campanha_id: 1,
            versao: 1,
            tipo: 'ACRESCIMO',
            nome: 'Só Autor',
            data_inicio: '2025-11-24',
            data_fim: '2025-11-24',
            pct_acrescimo: 0.5,
            pct_novo: null,
            autor: 'Gabriela',
            aprovador: null,
            aprovada_em: null,
            justificativa: '',
          },
          {
            campanha_id: 2,
            versao: 1,
            tipo: 'ACRESCIMO',
            nome: 'Autor e Aprovador sem Data',
            data_inicio: '2025-11-24',
            data_fim: '2025-11-24',
            pct_acrescimo: 0.5,
            pct_novo: null,
            autor: 'Gabriela',
            aprovador: 'Sérgio',
            aprovada_em: null,
            justificativa: '',
          },
          {
            campanha_id: 3,
            versao: 1,
            tipo: 'ACRESCIMO',
            nome: 'Todos Preenchidos',
            data_inicio: '2025-11-24',
            data_fim: '2025-11-24',
            pct_acrescimo: 0.5,
            pct_novo: null,
            autor: 'Gabriela',
            aprovador: 'Sérgio',
            aprovada_em: '2025-11-20T10:00:00Z',
            justificativa: '',
          },
        ],
      },
    ]

    const wrapper = mount(ComissaoPeriodo, { props: { linhas: linhasAprovacao } })
    const artigos = wrapper.findAll('.historico-item')
    expect(artigos[0]!.find('.historico-aprovacao').exists()).toBe(false)
    expect(artigos[1]!.find('.historico-aprovacao').exists()).toBe(false)
    expect(artigos[2]!.find('.historico-aprovacao').exists()).toBe(true)
    expect(artigos[2]!.find('.historico-aprovacao').text()).toBe(
      'Sugerida por Gabriela, aprovada por Sérgio em 20/11/2025',
    )
  })
})

describe('Aviso de conflitos (AvisoConflitos)', () => {
  it('mostra texto com (aprovada) e com (aguardando aprovação) usando datas da sobreposição', () => {
    const conflitos: ConflitoCampanha[] = [
      {
        campanha_id: 1,
        versao: 1,
        tipo: 'ACRESCIMO',
        nome: 'Campanha A',
        status: 'APROVADA',
        autor: 'Ana',
        data_inicio: '2025-11-20',
        data_fim: '2025-11-30',
        sobreposicao: { data_inicio: '2025-11-24', data_fim: '2025-11-30' },
        marcas: ['10'],
        cargos: ['150'],
      },
      {
        campanha_id: 2,
        versao: 1,
        tipo: 'ACRESCIMO',
        nome: 'Campanha B',
        status: 'AGUARDANDO_APROVACAO',
        autor: 'Carlos',
        data_inicio: '2025-11-25',
        data_fim: '2025-12-05',
        sobreposicao: { data_inicio: '2025-11-25', data_fim: '2025-11-30' },
        marcas: ['20'],
        cargos: ['100'],
      },
    ]

    const wrapper = mount(AvisoConflitos, { props: { conflitos } })
    const texto = wrapper.text()

    expect(texto).toContain('Esta campanha se sobrepõe a Campanha A (aprovada) em 24 a 30/11 para marcas Preto, cargos Gerente (150).')
    expect(texto).toContain('Esta campanha se sobrepõe a Campanha B (aguardando aprovação) em 25 a 30/11 para marcas Branco, cargos Vendedor loja (100).')
    expect(texto).not.toContain('[]')
    expect(texto).not.toContain('undefined')
  })

  it('não renderiza nada com lista vazia ou ausente', () => {
    expect(mount(AvisoConflitos, { props: { conflitos: [] } }).text()).toBe('')
    expect(mount(AvisoConflitos, { props: { conflitos: undefined } }).text()).toBe('')
  })
})

describe('Barra superior do chat (ChatHeader)', () => {
  it('habilita o botão nas etapas de envio e desabilita em sem_simulacao e desatualizada com motivo', () => {
    // Etapa pronta: habilitado
    const wrapperPronta = mount(ChatHeader, {
      props: { data: '27/10/2026', etapaAprovacao: 'pronta', ocupado: false, painelAberto: true },
    })
    const btnPronta = wrapperPronta.findAll('button').find((b) => b.text().includes('Compartilhar'))!
    expect(btnPronta.attributes('disabled')).toBeUndefined()

    // Etapa fora_do_orcamento: habilitado
    const wrapperFora = mount(ChatHeader, {
      props: { data: '27/10/2026', etapaAprovacao: 'fora_do_orcamento', ocupado: false, painelAberto: true },
    })
    const btnFora = wrapperFora.findAll('button').find((b) => b.text().includes('Compartilhar'))!
    expect(btnFora.attributes('disabled')).toBeUndefined()

    // Etapa sem_simulacao: desabilitado com motivo
    const wrapperSemSimulacao = mount(ChatHeader, {
      props: { data: '27/10/2026', etapaAprovacao: 'sem_simulacao', ocupado: false, painelAberto: true },
    })
    const btnSemSimulacao = wrapperSemSimulacao.findAll('button').find((b) => b.text().includes('Compartilhar'))!
    expect(btnSemSimulacao.attributes('disabled')).toBeDefined()
    expect(btnSemSimulacao.attributes('title')).toBe('Simule a campanha para compartilhar.')

    // Etapa desatualizada: desabilitado com motivo (o aviso migrou para o topo da conversa, 427:694)
    const wrapperDesatualizada = mount(ChatHeader, {
      props: { data: '27/10/2026', etapaAprovacao: 'desatualizada', ocupado: false, painelAberto: true },
    })
    const btnDesatualizada = wrapperDesatualizada.findAll('button').find((b) => b.text().includes('Compartilhar'))!
    expect(btnDesatualizada.attributes('disabled')).toBeDefined()
    expect(btnDesatualizada.attributes('title')).toBe('A campanha mudou depois da simulação: simule de novo para compartilhar.')
  })

  it('controla a habilitação do botão de parâmetros pela presença de regra (427:713)', () => {
    const semRegra = mount(ChatHeader, {
      props: { data: '27/10/2026', etapaAprovacao: 'pronta', ocupado: false, painelAberto: false, temRegra: false },
    })
    const btnSemRegra = semRegra.find('button[aria-label="Parâmetros da simulação"]')
    expect(btnSemRegra.attributes('disabled')).toBeDefined()

    const comRegra = mount(ChatHeader, {
      props: { data: '27/10/2026', etapaAprovacao: 'pronta', ocupado: false, painelAberto: false, temRegra: true },
    })
    const btnComRegra = comRegra.find('button[aria-label="Parâmetros da simulação"]')
    expect(btnComRegra.attributes('disabled')).toBeUndefined()
  })

  it('oculta o botão em somente_leitura e enviada', () => {
    const wrapperLeitura = mount(ChatHeader, {
      props: { data: '27/10/2026', etapaAprovacao: 'somente_leitura', ocupado: false, painelAberto: true },
    })
    expect(wrapperLeitura.findAll('button').some((b) => b.text().includes('Compartilhar'))).toBe(false)

    const wrapperEnviada = mount(ChatHeader, {
      props: { data: '27/10/2026', etapaAprovacao: 'enviada', ocupado: false, painelAberto: true },
    })
    expect(wrapperEnviada.findAll('button').some((b) => b.text().includes('Compartilhar'))).toBe(false)
  })

  it('mostra status e versão quando há campanha salva', () => {
    const wrapper = mount(ChatHeader, {
      props: {
        campanha: { id: 5, nome: 'Campanha de Páscoa', status: 'AGUARDANDO_APROVACAO', versao_atual: 2 },
        data: '27/10/2026',
        etapaAprovacao: 'pronta',
        ocupado: false,
        painelAberto: true,
      },
    })

    expect(wrapper.text()).toContain('Campanha de Páscoa')
    expect(wrapper.text()).toContain('Aguardando aprovação')
    expect(wrapper.text()).toContain('v2')
  })

  it('mostra "Nova campanha" quando a conversa ainda não virou campanha', () => {
    const wrapper = mount(ChatHeader, {
      props: { data: '27/10/2026', etapaAprovacao: 'sem_simulacao', ocupado: false, painelAberto: true },
    })

    expect(wrapper.text()).toContain('Nova campanha')
  })
})

function erroHttp(status: number, message: string): AxiosError {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('falhou', 'ERR', config, null, {
    status,
    statusText: '',
    data: { message },
    headers: {},
    config,
  })
}

describe('Store: erroEnvio e último resultado', () => {
  let fakeServico: FakeServicoCampanha

  beforeEach(() => {
    setActivePinia(createPinia())
    fakeServico = new FakeServicoCampanha()
    definirServicoCampanha(fakeServico)
  })

  it('preenche erroEnvio na falha e o limpa na nova tentativa', async () => {
    const chat = useChatStore()
    await chat.enviar('Campanha de Teste')
    await chat.simular()

    fakeServico.falha = erroHttp(500, 'Falha de conexão com a API')

    await chat.enviarParaAprovacao('Campanha Falha')
    expect(chat.erroEnvio).toContain('Falha de conexão com a API')

    fakeServico.falha = null
    await chat.enviarParaAprovacao('Campanha Sucesso')
    expect(chat.erroEnvio).toBeNull()
  })

  it('deriva ultimoResultado a partir das mensagens do chat', async () => {
    const chat = useChatStore()
    expect(chat.ultimoResultado).toBeNull()

    await chat.enviar('Simular')
    await chat.simular()

    expect(chat.ultimoResultado).not.toBeNull()
    expect(chat.ultimoResultado?.totais.diferenca).toBe(23736.17)
  })
})
