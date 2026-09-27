<script setup lang="ts">
import { computed } from 'vue'
import { formatarMilhares, lerReaisInteiros } from '../../formatacao'

// Valor em reais inteiros com separador de milhar enquanto digita ("2000000" vira "2.000.000").
// Meta e orçamento de campanha são valores redondos; centavos só atrapalhariam a leitura.
const props = defineProps<{ modelValue: number | null; faltando: boolean; idCampo: string; rotulo: string }>()
const emit = defineEmits<{ 'update:modelValue': [valor: number | null] }>()

const texto = computed(() => (props.modelValue === null ? '' : formatarMilhares(props.modelValue)))

function digitar(evento: Event): void {
  const campo = evento.target as HTMLInputElement
  const valor = lerReaisInteiros(campo.value)
  // Reescreve o campo na hora para o separador aparecer enquanto a pessoa digita.
  campo.value = valor === null ? '' : formatarMilhares(valor)
  emit('update:modelValue', valor)
}
</script>

<template>
  <label class="moeda" :class="{ 'moeda--faltando': faltando }">
    <span class="moeda-prefixo" aria-hidden="true">R$</span>
    <input :id="idCampo" :value="texto" type="text" inputmode="numeric" autocomplete="off" :aria-label="rotulo"
      :placeholder="faltando ? 'Informe o valor' : '0'" @input="digitar" />
  </label>
</template>

<style scoped>
.moeda {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 8px;
  background-color: var(--color-black-bg1);
  box-shadow: inset 0 0 0 1px transparent;
  transition: box-shadow 0.15s;
  cursor: text;
}

.moeda:hover {
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 20%);
}

.moeda:focus-within {
  box-shadow: inset 0 0 0 1px var(--color-blue);
}

.moeda--faltando {
  box-shadow: inset 0 0 0 1px var(--color-orange);
}

.moeda-prefixo {
  color: var(--color-gray-txt2-dark);
  font-size: 14px;
}

input {
  width: 100%;
  min-width: 0;
  padding: 9px 0;
  border: none;
  outline: none;
  background: none;
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 16px;
  font-weight: 500;
}

input::placeholder {
  color: var(--color-gray-txt3-dark);
  font-weight: 400;
}

.moeda--faltando input::placeholder {
  color: var(--color-orange);
}
</style>
