import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CampoMoeda from '../components/campos/CampoMoeda.vue'
import CampoPercentual from '../components/campos/CampoPercentual.vue'

const base = { faltando: false, idCampo: 'x', rotulo: 'Campo' }

describe('CampoMoeda', () => {
  it('põe o separador de milhar enquanto digita e emite reais inteiros', async () => {
    const wrapper = mount(CampoMoeda, { props: { ...base, modelValue: null } })
    const input = wrapper.find('input')

    await input.setValue('2000000')

    expect((input.element as HTMLInputElement).value).toBe('2.000.000')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2000000])
  })
})

describe('CampoPercentual', () => {
  it('ajusta 0,1 ponto pelos botões sem passar do mínimo', async () => {
    const wrapper = mount(CampoPercentual, { props: { ...base, modelValue: 1 } })

    await wrapper.findAll('button')[1]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1.1])

    await wrapper.setProps({ modelValue: 0.05 })
    await wrapper.findAll('button')[0]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([0.01])
  })

  it('aceita vírgula ao digitar', async () => {
    const wrapper = mount(CampoPercentual, { props: { ...base, modelValue: 1 } })

    await wrapper.find('input').setValue('0,84')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0.84])
  })
})
