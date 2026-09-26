<script setup lang="ts">
import { computed } from 'vue'
import { estaVazio } from '../stores/chat'
import type { ParametroRegra, Periodo, ValorParametro } from '../types'

const TODAS = 'ALL'

const props = defineProps<{ parametro: ParametroRegra }>()
const emit = defineEmits<{ alterar: [valor: ValorParametro] }>()

const faltando = computed(() => props.parametro.required && estaVazio(props.parametro.value))
const periodo = computed<Periodo>(() => (props.parametro.value as Periodo | null) ?? { data_inicio: '', data_fim: '' })
const selecionados = computed(() => (props.parametro.value as string[] | null) ?? [])
const numero = computed(() => (props.parametro.value as number | null) ?? '')
const idCampo = computed(() => `param-${props.parametro.key}`)

function alterarData(ponta: keyof Periodo, valor: string): void {
  emit('alterar', { ...periodo.value, [ponta]: valor })
}

function alterarNumero(texto: string): void {
  emit('alterar', texto === '' ? null : Number(texto))
}

// "Todas as marcas" é exclusivo: escolher uma marca específica desmarca o "Todas", e vice-versa.
function alternarOpcao(id: string): void {
  const atuais = selecionados.value.filter((s) => (id === TODAS ? false : s !== TODAS))
  const proximos = atuais.includes(id) ? atuais.filter((s) => s !== id) : [...atuais, id]
  emit('alterar', proximos)
}
</script>

<template>
  <fieldset class="campo" :class="{ 'campo--faltando': faltando }">
    <legend class="campo-rotulo">
      {{ parametro.label }}
      <span v-if="faltando" class="campo-aviso">falta preencher</span>
    </legend>

    <div v-if="parametro.type === 'date_range'" class="campo-datas">
      <label :for="`${idCampo}-inicio`" class="sr-only">Início</label>
      <input :id="`${idCampo}-inicio`" type="date" :value="periodo.data_inicio"
        @change="alterarData('data_inicio', ($event.target as HTMLInputElement).value)" />
      <span aria-hidden="true">até</span>
      <label :for="`${idCampo}-fim`" class="sr-only">Fim</label>
      <input :id="`${idCampo}-fim`" type="date" :value="periodo.data_fim"
        @change="alterarData('data_fim', ($event.target as HTMLInputElement).value)" />
    </div>

    <div v-else-if="parametro.type === 'multi_select'" class="campo-opcoes">
      <button v-for="opcao in parametro.options ?? []" :key="opcao.id" type="button" class="opcao"
        :aria-pressed="selecionados.includes(opcao.id)" @click="alternarOpcao(opcao.id)">
        {{ opcao.label }}
      </button>
    </div>

    <div v-else class="campo-numero">
      <span v-if="parametro.type === 'currency'" class="campo-unidade">R$</span>
      <input :id="idCampo" type="number" min="0" :step="parametro.type === 'percentage' ? 0.1 : 100"
        :value="numero" :aria-label="parametro.label"
        @change="alterarNumero(($event.target as HTMLInputElement).value)" />
      <span v-if="parametro.type === 'percentage'" class="campo-unidade">%</span>
    </div>
  </fieldset>
</template>

<style scoped>
.campo {
  border: none;
  padding: 10px 0 10px 12px;
  box-shadow: inset 2px 0 0 rgb(255 255 255 / 8%);
}

.campo--faltando {
  box-shadow: inset 2px 0 0 var(--color-orange);
}

.campo-rotulo {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 8px;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
}

.campo-aviso {
  color: var(--color-orange);
  font-size: 12px;
}

.campo-datas,
.campo-numero {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--color-gray-txt3-dark);
  font-size: 13px;
}

input {
  min-width: 0;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  background-color: var(--color-black-bg1);
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: 15px;
  color-scheme: dark;
}

.campo-numero input {
  width: 140px;
}

.campo-datas input {
  flex: 1 1 0;
}

input:focus-visible,
.opcao:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 1px;
}

.campo-unidade {
  font-family: var(--font-inconsolata);
}

.campo-opcoes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.opcao {
  padding: 4px 10px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 999px;
  background: transparent;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
  cursor: pointer;
}

.opcao[aria-pressed='true'] {
  border-color: var(--color-blue);
  background-color: rgb(0 180 241 / 14%);
  color: var(--color-white-txt1);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
