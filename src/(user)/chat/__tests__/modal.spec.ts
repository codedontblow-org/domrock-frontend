import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import Modal from '../components/PublicarCampanhaModal.vue'
import { resumirCampanha } from '../resumo'
import { regraBlackFriday } from './fakes'

let wrapper: VueWrapper
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterEach(() => { wrapper?.unmount(); document.body.innerHTML = ''; vi.unstubAllGlobals() })

it('abre com nome e aviso, mantém o erro visível e emite confirmação e cancelamento', async () => {
  wrapper = mount(Modal, { attachTo: document.body, props: {
    aberto: true, campanha: resumirCampanha(regraBlackFriday()),
  } })
  await flushPromises()
  const dialog = document.querySelector('[role="dialog"]')!
  expect(dialog.textContent).toContain('Publicando Campanha')
  expect(dialog.textContent).toContain('Black Friday +1%')
  expect(dialog.textContent).toContain('histórico de mensagens')
  const botoes = dialog.querySelectorAll('button')
  botoes[1]!.click()
  expect(wrapper.emitted('publicar')).toHaveLength(1)
  await wrapper.setProps({ erro: 'Campanha não enviada.' })
  expect(document.querySelector('[role="alert"]')?.textContent).toBe('Campanha não enviada.')
  botoes[0]!.click()
  expect(wrapper.emitted('fechar')).toHaveLength(1)
})

it('impede confirmações duplicadas durante a submissão', async () => {
  wrapper = mount(Modal, { attachTo: document.body, props: {
    aberto: true, campanha: resumirCampanha(regraBlackFriday()), publicando: true,
  } })
  await flushPromises()
  const buttons = document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')
  expect(buttons.length).toBe(2)
  for (const button of buttons) { expect(button.disabled).toBe(true); button.click() }
  expect(wrapper.emitted('publicar')).toBeUndefined()
  expect(wrapper.emitted('fechar')).toBeUndefined()
})
