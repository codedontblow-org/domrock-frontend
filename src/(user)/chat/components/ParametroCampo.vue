<script setup lang="ts">
import { computed } from 'vue'
import { estaVazio } from '../stores/chat'
import { nomeDaOpcao, ROTULOS_CURTOS_PARAMETRO } from '../rotulos'
import type { ParametroRegra, Periodo, ValorParametro } from '../types'

const TODAS = 'ALL'

const props = defineProps<{ parametro: ParametroRegra }>()
const emit = defineEmits<{ alterar: [valor: ValorParametro] }>()

const faltando = computed(() => props.parametro.required && estaVazio(props.parametro.value))
const periodo = computed<Periodo>(() => (props.parametro.value as Periodo | null) ?? { data_inicio: '', data_fim: '' })
const selecionados = computed(() => (props.parametro.value as string[] | null) ?? [])
const numero = computed(() => (props.parametro.value as number | null) ?? '')
const idCampo = computed(() => `param-${props.parametro.key}`)
const rotulo = computed(() => ROTULOS_CURTOS_PARAMETRO[props.parametro.key] ?? props.parametro.label)

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
  <div class="campo" :class="[`campo--${parametro.type}`, { 'campo--faltando': faltando }]" role="group" :aria-labelledby="`${idCampo}-rotulo`">
    <span :id="`${idCampo}-rotulo`" class="campo-rotulo" :title="parametro.label">
      {{ rotulo }}
      <span v-if="faltando" class="sr-only">(falta preencher)</span>
    </span>

    <div v-if="parametro.type === 'date_range'" class="campo-valor campo-datas">
      <input :id="`${idCampo}-inicio`" type="date" :value="periodo.data_inicio ?? ''" aria-label="Início"
        @change="alterarData('data_inicio', ($event.target as HTMLInputElement).value)" />
      <span aria-hidden="true">a</span>
      <input :id="`${idCampo}-fim`" type="date" :value="periodo.data_fim ?? ''" aria-label="Fim"
        @change="alterarData('data_fim', ($event.target as HTMLInputElement).value)" />
    </div>

    <div v-else-if="parametro.type === 'multi_select'" class="campo-valor campo-opcoes">
      <button v-for="opcao in parametro.options ?? []" :key="opcao.id" type="button" class="opcao"
        :title="opcao.label" :aria-pressed="selecionados.includes(opcao.id)" @click="alternarOpcao(opcao.id)">
        {{ nomeDaOpcao(parametro.key, opcao.id, opcao.label) }}
      </button>
    </div>

    <div v-else class="campo-valor campo-numero">
      <span v-if="parametro.type === 'currency'" class="campo-unidade">R$</span>
      <input :id="idCampo" type="number" min="0" :step="parametro.type === 'percentage' ? 0.1 : 100"
        :value="numero" :aria-label="parametro.label" :placeholder="faltando ? 'informe' : ''"
        @change="alterarNumero(($event.target as HTMLInputElement).value)" />
      <span v-if="parametro.type === 'percentage'" class="campo-unidade">%</span>
    </div>
  </div>
</template>

<style scoped>
.campo {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 10px;
  align-items: baseline;
  padding: 7px 0;
}

.campo-rotulo {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  line-height: 1.3;
}

/* Pendência: rótulo e borda do campo em laranja; o painel conta quantas faltam no cabeçalho. */
.campo--faltando .campo-rotulo {
  color: var(--color-orange);
}

.campo--faltando input {
  box-shadow: inset 0 0 0 1px var(--color-orange);
}

.campo-valor {
  min-width: 0;
}

.campo-datas,
.campo-numero {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--color-gray-txt3-dark);
  font-size: 13px;
}

input {
  min-width: 0;
  padding: 4px 6px;
  border: none;
  border-radius: 4px;
  background-color: var(--color-black-bg1);
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: 14px;
  color-scheme: dark;
}

/* Duas datas não cabem ao lado do rótulo sem cortar o ano: o período usa a largura toda. */
.campo--date_range {
  grid-template-columns: 1fr;
  gap: 4px;
}

.campo-datas input {
  flex: 1 1 0;
  font-size: 13px;
}

.campo-numero input {
  width: 120px;
}

input::placeholder {
  color: var(--color-orange);
  opacity: 0.7;
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
  gap: 4px;
}

.opcao {
  padding: 2px 8px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 999px;
  background: transparent;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}

.opcao:hover {
  border-color: rgb(255 255 255 / 25%);
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
