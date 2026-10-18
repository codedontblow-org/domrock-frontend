<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/vue'
import type { ResumoCampanha, ComissaoPeriodo } from '../types'
import Resumo from './ResumoCampanha.vue'
import Comissoes from './ComissaoPeriodo.vue'
import AvisoConflitos from './AvisoConflitos.vue'
defineProps<{
  aberto: boolean
  campanha: ResumoCampanha
  comissoes?: ComissaoPeriodo[]
  publicando?: boolean
  erro?: string
}>()
const emit = defineEmits<{ fechar: []; publicar: [] }>()
const cancelar = ref<HTMLButtonElement | null>(null)
</script>
<template>
  <Dialog
    :open="aberto"
    :initial-focus="cancelar"
    class="modal"
    @close="!publicando && emit('fechar')"
  >
    <div class="fundo" aria-hidden="true" />
    <div class="posicao">
      <DialogPanel class="painel" :aria-busy="publicando">
        <DialogTitle class="titulo"
          ><i class="bi bi-send-fill" aria-hidden="true" /> Publicando Campanha</DialogTitle
        >
        <p class="nome">{{ campanha.nome }}</p>
        <DialogDescription class="descricao"
          >Publique essa campanha para que ela entre numa fila de aprovação, aguardando para ser
          revisada por um supervisor e então entrar em vigência.</DialogDescription
        >
        <details class="detalhes">
          <summary>Conferir informações da campanha</summary>
          <Resumo :campanha="campanha" />
          <Comissoes :linhas="comissoes" />
        </details>
        <AvisoConflitos :conflitos="campanha.conflitos" />
        <p class="aviso">
          <i class="bi bi-exclamation-triangle" aria-hidden="true" /> Essa ação irá expor seu
          histórico de mensagens nesse chat.
        </p>
        <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
        <div class="acoes">
          <button ref="cancelar" type="button" :disabled="publicando" @click="emit('fechar')">
            Cancelar
          </button>
          <button type="button" class="publicar" :disabled="publicando" @click="emit('publicar')">
            {{ publicando ? 'Publicando…' : 'Publicar' }}
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
<style scoped>
.modal {
  position: relative;
  z-index: 100;
}
.fundo {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 65%);
}
.posicao {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.painel {
  width: 100%;
  max-width: 560px;
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  padding: 36px;
  border-radius: 8px;
  background: var(--color-black-bg1);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
}
.titulo {
  font-size: 22px;
  margin-bottom: 16px;
}
.titulo i {
  color: var(--color-blue);
  margin-right: 6px;
}
.nome {
  font: 12px var(--font-inconsolata);
  color: var(--color-gray-txt2-dark);
  margin-bottom: 10px;
  overflow-wrap: anywhere;
}
.descricao {
  font-size: 14px;
  line-height: 1.4;
}
.detalhes {
  margin: 24px 0;
}
summary {
  cursor: pointer;
  color: var(--color-gray-txt2-dark);
  font-size: 13px;
  padding-bottom: 12px;
}
.aviso {
  margin-top: 24px;
  padding: 8px;
  border-left: 2px solid var(--color-red);
  background: var(--color-black-bg2);
  color: var(--color-gray-txt2-dark);
  font: 12px var(--font-inconsolata);
}
.aviso i {
  color: var(--color-red);
}
.acoes {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
button {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.publicar {
  background: var(--color-blue);
  border-color: var(--color-blue);
  color: var(--color-black-bg1);
}
button:disabled {
  opacity: 0.5;
  cursor: wait;
}
button:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 3px;
}
.erro {
  color: var(--color-red);
  font-size: 13px;
  margin-top: 12px;
}
@media (max-width: 520px) {
  .painel {
    padding: 24px 18px;
  }
  .titulo {
    font-size: 20px;
  }
}
</style>
