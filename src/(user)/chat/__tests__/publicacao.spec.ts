import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { definirServicoCampanha, useChatStore } from '../stores/chat'
import { FakeServicoCampanha, regraBlackFriday } from './fakes'
import Resumo from '../components/ResumoCampanha.vue'
import Comissoes from '../components/ComissaoPeriodo.vue'
import Aviso from '../components/AvisoConflitos.vue'
import { resumirCampanha } from '../resumo'
import type { ComissaoPeriodo } from '../types'

beforeEach(() => {
  setActivePinia(createPinia())
  definirServicoCampanha(new FakeServicoCampanha())
})

describe('Publicação da versão simulada', () => {
  it('exige simulação e invalida o resultado quando parâmetros mudam', async () => {
    const chat = useChatStore()
    await chat.enviar('Black Friday')
    expect(chat.podePublicar).toBe(false)
    await chat.simular()
    expect(chat.podePublicar).toBe(true)
    chat.atualizarParametro('pct_acrescimo', 2)
    expect(chat.podePublicar).toBe(false)
    expect(chat.resultadoAtual).toBeNull()
    await chat.simular()
    expect(chat.podePublicar).toBe(true)
  })

  it('não associa uma simulação em andamento a parâmetros editados depois', async () => {
    const chat = useChatStore()
    await chat.enviar('Black Friday')
    const pendente = chat.simular()
    chat.atualizarParametro('pct_acrescimo', 2)
    await pendente
    expect(chat.podePublicar).toBe(false)
  })
})

describe('Resumo e comissão', () => {
  it.each([false, true])(
    'mostra dados reais e distingue informação ausente; compacto=%s',
    (compacto) => {
      const campanha = resumirCampanha(regraBlackFriday())
      const wrapper = mount(Resumo, { props: { campanha, compacto } })
      expect(wrapper.text()).toContain('24/11/2025')
      expect(wrapper.text()).toContain('Conflitos não verificados')
      expect(wrapper.text()).toContain('Retorno Não informado')
      expect(wrapper.classes('compacto')).toBe(compacto)
    },
  )

  const linha: ComissaoPeriodo = {
    id: '1',
    marca: '10',
    cargo: 'Gerente (150)',
    inicio: '2026-11-25',
    fim: '2026-11-30',
    base: 1,
    vigente: 2.5,
    comCampanha: 3,
    historico: [
      {
        id: 'h1',
        nome: 'Campanha anterior',
        inicio: '2026-11-25',
        fim: '2026-11-30',
        acrescimo: 1.5,
        autor: 'Ana',
        aprovador: 'João',
        aprovadoEm: '2026-11-20',
        justificativa: 'Meta de novembro',
      },
    ],
  }
  it('mostra trechos separados e o histórico completo das campanhas', () => {
    const wrapper = mount(Comissoes, {
      props: {
        linhas: [
          {
            ...linha,
            id: '0',
            inicio: '2026-11-24',
            fim: '2026-11-24',
            vigente: 1,
            comCampanha: 1.5,
            historico: [],
          },
          linha,
        ],
      },
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.text()).toContain('24/11/2026')
    expect(wrapper.text()).toContain('2,5%')
    expect(wrapper.find('summary').text()).toContain('1 campanha')
    expect(wrapper.find('details').text()).toContain('João')
    expect(wrapper.find('details').text()).toContain('Meta de novembro')
    expect(wrapper.text()).toContain('Sem campanhas no período')
  })
  it('não inventa percentuais nem conflitos quando não informados', () => {
    expect(mount(Comissoes).find('table').exists()).toBe(false)
    expect(mount(Aviso, { props: { conflitos: [] } }).text()).toBe('')
  })
  it('mostra sobreposição como aviso sem bloquear ações', () => {
    const wrapper = mount(Aviso, {
      props: {
        conflitos: [
          {
            id: 'c',
            nome: 'Black Friday',
            inicio: '2026-11-25',
            fim: '2026-11-30',
            marca: '10',
            cargos: ['Gerente'],
          },
        ],
      },
    })
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toContain('Esta campanha se sobrepõe a Black Friday (aprovada)')
    expect(wrapper.text()).toContain('marca 10, cargos Gerente')
  })
})
