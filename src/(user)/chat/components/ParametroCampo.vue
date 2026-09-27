<script setup lang="ts">
import { computed } from 'vue'
import { estaVazio } from '../stores/chat'
import { nomeDaOpcao, ROTULOS_CURTOS_PARAMETRO } from '../rotulos'
import type { ParametroRegra, Periodo, ValorParametro } from '../types'
import CampoMoeda from './campos/CampoMoeda.vue'
import CampoPercentual from './campos/CampoPercentual.vue'
import CampoPeriodo from './campos/CampoPeriodo.vue'

const TODAS = 'ALL'

const props = defineProps<{ parametro: ParametroRegra }>()
const emit = defineEmits<{ alterar: [valor: ValorParametro] }>()

const faltando = computed(() => props.parametro.required && estaVazio(props.parametro.value))
const selecionados = computed(() => (props.parametro.value as string[] | null) ?? [])
const numero = computed(() => (props.parametro.value as number | null) ?? null)
const idCampo = computed(() => `param-${props.parametro.key}`)
const rotulo = computed(() => ROTULOS_CURTOS_PARAMETRO[props.parametro.key] ?? props.parametro.label)

// "Todas as marcas" é exclusivo: escolher uma marca específica desmarca o "Todas", e vice-versa.
function alternarOpcao(id: string): void {
  const atuais = selecionados.value.filter((s) => (id === TODAS ? false : s !== TODAS))
  const proximos = atuais.includes(id) ? atuais.filter((s) => s !== id) : [...atuais, id]
  emit('alterar', proximos)
}
</script>

<template>
  <div class="campo" :class="{ 'campo--faltando': faltando }" role="group" :aria-labelledby="`${idCampo}-rotulo`">
    <span :id="`${idCampo}-rotulo`" class="campo-rotulo" :title="parametro.label">
      {{ rotulo }}
      <span v-if="faltando" class="campo-pendente">falta preencher</span>
    </span>

    <CampoPeriodo v-if="parametro.type === 'date_range'" :model-value="parametro.value as Periodo | null"
      :faltando="faltando" :id-campo="idCampo" @update:model-value="emit('alterar', $event)" />

    <div v-else-if="parametro.type === 'multi_select'" class="campo-opcoes">
      <button v-for="opcao in parametro.options ?? []" :key="opcao.id" type="button" class="opcao"
        :title="opcao.label" :aria-pressed="selecionados.includes(opcao.id)" @click="alternarOpcao(opcao.id)">
        {{ nomeDaOpcao(parametro.key, opcao.id, opcao.label) }}
      </button>
    </div>

    <CampoPercentual v-else-if="parametro.type === 'percentage'" :model-value="numero" :faltando="faltando"
      :id-campo="idCampo" :rotulo="parametro.label" @update:model-value="emit('alterar', $event)" />

    <CampoMoeda v-else :model-value="numero" :faltando="faltando" :id-campo="idCampo" :rotulo="parametro.label"
      @update:model-value="emit('alterar', $event)" />
  </div>
</template>

<style scoped>
/* Rótulo em cima e campo na largura toda, como nos formulários do Stripe e do Linear:
   lê de cima para baixo e o período cabe inteiro sem cortar o ano. */
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.campo-rotulo {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  font-weight: 500;
}

.campo--faltando .campo-rotulo {
  color: var(--color-orange);
}

.campo-pendente {
  font-size: 12px;
  font-weight: 400;
}

.campo-opcoes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.opcao {
  padding: 4px 10px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 999px;
  background: transparent;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  line-height: 18px;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s, color 0.15s;
}

.opcao:hover {
  border-color: rgb(255 255 255 / 25%);
  color: var(--color-white-txt1);
}

.opcao[aria-pressed='true'] {
  border-color: var(--color-blue);
  background-color: rgb(0 180 241 / 14%);
  color: var(--color-white-txt1);
}

.opcao:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 1px;
}
</style>
