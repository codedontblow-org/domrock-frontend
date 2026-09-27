<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDatePicker, type PresetDate } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { ptBR } from 'date-fns/locale'
import type { Periodo } from '../../types'

// Calendário de intervalo no lugar dos dois <input type="date"> nativos, que mostravam a data
// no formato do sistema (10/31/2025 em inglês) e não diziam quais meses existem na base.
const props = defineProps<{ modelValue: Periodo | null; faltando: boolean; idCampo: string }>()
const emit = defineEmits<{ 'update:modelValue': [valor: Periodo] }>()

// A base importada vai de julho a dezembro de 2025; fora disso não há o que simular.
const PRIMEIRO_DIA = new Date(2025, 6, 1)
const ULTIMO_DIA = new Date(2025, 11, 31)
const MESES = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const atalhos: PresetDate[] = [
  ...MESES.map((nome, indice) => ({
    label: `${nome}/25`,
    value: [new Date(2025, 6 + indice, 1), new Date(2025, 7 + indice, 0)],
  })),
  { label: 'Black Friday', value: [new Date(2025, 10, 24), new Date(2025, 10, 30)] },
]

function paraIntervalo(periodo: Periodo | null): string[] | null {
  const { data_inicio: inicio, data_fim: fim } = periodo ?? {}
  return inicio && fim ? [inicio, fim] : null
}

// Com auto-apply, o intervalo precisa de partialRange: false; sem isso o menu fecha no 1º clique
// (docs, "auto-apply"). O painel só recebe o período com as duas datas escolhidas.
const intervalo = ref<string[] | null>(paraIntervalo(props.modelValue))
watch(() => props.modelValue, (periodo) => { intervalo.value = paraIntervalo(periodo) })

function alterar(valor: string[] | null): void {
  const [inicio, fim] = valor ?? []
  if (!inicio || !fim) return
  intervalo.value = valor
  emit('update:modelValue', { data_inicio: inicio, data_fim: fim })
}
</script>

<template>
  <VueDatePicker
    :model-value="intervalo"
    class="campo-periodo"
    :class="{ 'campo-periodo--faltando': faltando }"
    :range="{ partialRange: false }"
    auto-apply
    dark
    model-type="yyyy-MM-dd"
    :locale="ptBR"
    :formats="{ input: 'dd/MM/yyyy' }"
    :min-date="PRIMEIRO_DIA"
    :max-date="ULTIMO_DIA"
    prevent-min-max-navigation
    :start-date="intervalo?.[0] ?? PRIMEIRO_DIA"
    :preset-dates="atalhos"
    :time-config="{ enableTimePicker: false }"
    :input-attrs="{ id: idCampo, clearable: false }"
    placeholder="Escolha o período"
    @update:model-value="alterar"
  />
</template>

<style>
/* Tema do calendário nas cores do CampLana (fica fora do escopo: o menu é renderizado à parte).
   Na v14 a classe é .dp--theme-dark (a documentação ainda cita .dp__theme_dark); o :root dá
   especificidade para vencer o main.css da biblioteca, que pode carregar depois. */
:root .dp--theme-dark {
  --dp-background-color: var(--color-black-bg1);
  --dp-text-color: var(--color-white-txt1);
  --dp-hover-color: rgb(255 255 255 / 8%);
  --dp-hover-text-color: var(--color-white-txt1);
  --dp-hover-icon-color: var(--color-white-txt1);
  --dp-primary-color: var(--color-blue);
  --dp-primary-text-color: var(--color-black-bg1);
  --dp-secondary-color: var(--color-gray-txt3-dark);
  --dp-border-color: transparent;
  --dp-menu-border-color: rgb(255 255 255 / 10%);
  --dp-border-color-hover: rgb(255 255 255 / 20%);
  --dp-border-color-focus: var(--color-blue);
  --dp-disabled-color: transparent;
  --dp-disabled-color-text: rgb(255 255 255 / 22%);
  --dp-icon-color: var(--color-gray-txt2-dark);
  --dp-range-between-dates-background-color: rgb(0 180 241 / 16%);
  --dp-range-between-dates-text-color: var(--color-white-txt1);
  --dp-range-between-border-color: transparent;
  --dp-font-family: var(--font-raleway);
  --dp-font-size: 14px;
  --dp-cell-size: 34px;
  --dp-border-radius: 8px;
  --dp-cell-border-radius: 6px;
  --dp-input-padding: 7px 30px 7px 12px;
}

.campo-periodo .dp__input {
  font-weight: 500;
}

.campo-periodo--faltando .dp__input {
  box-shadow: inset 0 0 0 1px var(--color-orange);
}

.campo-periodo .dp__input::placeholder {
  color: var(--color-orange);
  opacity: 0.8;
}
</style>
