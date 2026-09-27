<script setup lang="ts">
import { computed } from 'vue'
import { lerDecimal } from '../../formatacao'

// Acréscimo em pontos percentuais com botões de ±0,1, como os steppers de apps de investimento:
// o ajuste fino mais comum é "um pouco menos" ou "um pouco mais", sem precisar digitar.
const props = defineProps<{ modelValue: number | null; faltando: boolean; idCampo: string; rotulo: string }>()
const emit = defineEmits<{ 'update:modelValue': [valor: number | null] }>()

const PASSO = 0.1
const MINIMO = 0.01
const MAXIMO = 100
const DECIMAL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const texto = computed(() => (props.modelValue === null ? '' : DECIMAL.format(props.modelValue)))

function limitar(valor: number): number {
  return Math.min(MAXIMO, Math.max(MINIMO, Math.round(valor * 100) / 100))
}

function passo(direcao: 1 | -1): void {
  emit('update:modelValue', limitar((props.modelValue ?? 0) + direcao * PASSO))
}

function confirmar(evento: Event): void {
  const campo = evento.target as HTMLInputElement
  const valor = lerDecimal(campo.value)
  emit('update:modelValue', valor === null ? null : limitar(valor))
  campo.value = valor === null ? '' : DECIMAL.format(limitar(valor))
}
</script>

<template>
  <div class="percentual" :class="{ 'percentual--faltando': faltando }">
    <button type="button" class="percentual-passo" :aria-label="`Diminuir ${rotulo} em 0,1 ponto`"
      :disabled="modelValue !== null && modelValue <= MINIMO" @click="passo(-1)">
      <i class="bi bi-dash" aria-hidden="true" />
    </button>
    <label class="percentual-valor">
      <input :id="idCampo" :value="texto" type="text" inputmode="decimal" autocomplete="off" :aria-label="rotulo"
        :placeholder="faltando ? 'Informe' : '0,00'" @change="confirmar" @keydown.up.prevent="passo(1)"
        @keydown.down.prevent="passo(-1)" />
      <span aria-hidden="true">%</span>
    </label>
    <button type="button" class="percentual-passo" :aria-label="`Aumentar ${rotulo} em 0,1 ponto`" @click="passo(1)">
      <i class="bi bi-plus" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.percentual {
  display: inline-flex;
  align-self: flex-start;
  align-items: stretch;
  border-radius: 8px;
  background-color: var(--color-black-bg1);
  box-shadow: inset 0 0 0 1px transparent;
}

.percentual:focus-within {
  box-shadow: inset 0 0 0 1px var(--color-blue);
}

.percentual--faltando {
  box-shadow: inset 0 0 0 1px var(--color-orange);
}

.percentual-passo {
  width: 30px;
  border: none;
  background: none;
  color: var(--color-gray-txt2-dark);
  font-size: 16px;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
}

.percentual-passo:first-child {
  border-radius: 8px 0 0 8px;
}

.percentual-passo:last-child {
  border-radius: 0 8px 8px 0;
}

.percentual-passo:hover:not(:disabled) {
  background-color: rgb(255 255 255 / 6%);
  color: var(--color-white-txt1);
}

.percentual-passo:disabled {
  opacity: 0.35;
  cursor: default;
}

.percentual-passo:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: -2px;
}

.percentual-valor {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--color-gray-txt2-dark);
  font-size: 14px;
  cursor: text;
}

input {
  width: 44px;
  padding: 6px 0;
  border: none;
  outline: none;
  background: none;
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 15px;
  font-weight: 500;
  text-align: right;
}

input::placeholder {
  color: var(--color-gray-txt3-dark);
  font-weight: 400;
}

.percentual--faltando input::placeholder {
  color: var(--color-orange);
}
</style>
