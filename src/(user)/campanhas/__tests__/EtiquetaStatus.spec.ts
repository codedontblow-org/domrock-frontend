import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EtiquetaStatus from '../components/EtiquetaStatus.vue'
import { useStatusCampanha } from '../useStatusCampanha'
import type { StatusCampanha } from '../../campanha/types'

describe('EtiquetaStatus', () => {
  it.each([
    ['RASCUNHO', 'status--rascunho'],
    ['AGUARDANDO_APROVACAO', 'status--aguardando'],
    ['APROVADA', 'status--aprovada'],
    ['REPROVADA', 'status--reprovada'],
    ['ARQUIVADA', 'status--arquivada'],
  ] as [StatusCampanha, string][])(
    'status %s tem a classe CSS %s',
    (status, classeEsperada) => {
      const wrapper = mount(EtiquetaStatus, { props: { status } })
      expect(wrapper.find(`.${classeEsperada}`).exists()).toBe(true)
    },
  )

  it('APROVADA com vigência Vigente mostra etiqueta Vigente', () => {
    const wrapper = mount(EtiquetaStatus, {
      props: { status: 'APROVADA', vigencia: 'Vigente' },
    })
    expect(wrapper.text()).toContain('Vigente')
    expect(wrapper.find('.etiqueta--vigente').exists()).toBe(true)
  })

  it('APROVADA com vigência Encerrada mostra etiqueta Encerrada', () => {
    const wrapper = mount(EtiquetaStatus, {
      props: { status: 'APROVADA', vigencia: 'Encerrada' },
    })
    expect(wrapper.text()).toContain('Encerrada')
    expect(wrapper.find('.etiqueta--encerrada').exists()).toBe(true)
  })

  it('sem vigência não renderiza etiqueta de vigência', () => {
    const wrapper = mount(EtiquetaStatus, {
      props: { status: 'RASCUNHO' },
    })
    expect(wrapper.find('.etiqueta--vigencia').exists()).toBe(false)
  })

  it('mostra o label correto para cada status', () => {
    const casos: [StatusCampanha, string][] = [
      ['RASCUNHO', 'Rascunho'],
      ['AGUARDANDO_APROVACAO', 'Aguardando aprovação'],
      ['APROVADA', 'Aprovada'],
      ['REPROVADA', 'Reprovada'],
      ['ARQUIVADA', 'Arquivada'],
    ]
    for (const [status, label] of casos) {
      const wrapper = mount(EtiquetaStatus, { props: { status } })
      expect(wrapper.text()).toContain(label)
    }
  })

  it('acompanha a troca de status depois de uma ação (ex.: Editar)', async () => {
    const wrapper = mount(EtiquetaStatus, { props: { status: 'REPROVADA' } })

    await wrapper.setProps({ status: 'RASCUNHO' })

    expect(wrapper.text()).toContain('Rascunho')
  })
})

describe('etiquetaVigencia', () => {
  const { etiquetaVigencia } = useStatusCampanha()

  it.each([
    ['VIGENTE', 'Vigente'],
    ['ENCERRADA', 'Encerrada'],
    ['FUTURA', null],
  ] as const)('APROVADA com vigência %s do backend -> %s', (vigencia, etiqueta) => {
    expect(etiquetaVigencia({ status: 'APROVADA', vigencia })).toBe(etiqueta)
  })

  it('fora de APROVADA não há etiqueta de vigência', () => {
    expect(etiquetaVigencia({ status: 'RASCUNHO', vigencia: 'VIGENTE' })).toBeNull()
  })
})
