<script setup lang="ts">
import { computed } from 'vue'
import ParametroCampo from './ParametroCampo.vue'
import type { RegraCampanha, ValorParametro } from '../types'

const props = defineProps<{
  regra: RegraCampanha
  camposVazios: string[]
  podeSimular: boolean
  simulando: boolean
}>()

const emit = defineEmits<{
  alterar: [key: string, valor: ValorParametro]
  simular: []
}>()

const regras = computed(() => props.regra.parametros.filter((p) => p.categoria === 'REGRA'))
const limites = computed(() => props.regra.parametros.filter((p) => p.categoria === 'CONSTRAINT'))

const aviso = computed(() => {
  if (props.simulando) return 'A Lana está gerando o código da regra e rodando sobre os dados reais.'
  const quantos = props.camposVazios.length
  if (quantos === 0) return 'Revise os valores. A simulação usa exatamente o que está aqui.'
  return quantos === 1 ? 'Preencha 1 campo para simular.' : `Preencha ${quantos} campos para simular.`
})
</script>

<template>
  <section class="ficha" aria-labelledby="ficha-titulo">
    <h2 id="ficha-titulo" class="ficha-titulo">Campanha</h2>
    <blockquote v-if="regra.raw_prompt" class="ficha-comando">{{ regra.raw_prompt }}</blockquote>

    <h3 class="ficha-grupo">Regra</h3>
    <ParametroCampo v-for="p in regras" :key="p.key" :parametro="p" @alterar="emit('alterar', p.key, $event)" />

    <h3 class="ficha-grupo">Limites</h3>
    <ParametroCampo v-for="p in limites" :key="p.key" :parametro="p" @alterar="emit('alterar', p.key, $event)" />

    <p class="ficha-aviso" aria-live="polite">{{ aviso }}</p>
    <button type="button" class="ficha-simular" :disabled="!podeSimular" @click="emit('simular')">
      {{ simulando ? 'Simulando…' : 'Simular campanha' }}
    </button>
  </section>
</template>

<style scoped>
.ficha {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px;
  border-radius: 6px;
  background-color: var(--color-black-bg2);
}

.ficha-titulo {
  color: var(--color-white-txt1);
  font-family: var(--font-forum);
  font-size: 32px;
  line-height: 1;
}

.ficha-comando {
  margin: 8px 0 4px;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  font-style: italic;
  line-height: 1.5;
}

.ficha-grupo {
  margin-top: 16px;
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 14px;
  font-weight: 600;
}

.ficha-aviso {
  margin-top: 16px;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  line-height: 1.4;
}

.ficha-simular {
  margin-top: 10px;
  padding: 12px;
  border: none;
  border-radius: 6px;
  background-color: var(--color-blue);
  color: var(--color-black-bg1);
  font-family: var(--font-raleway);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.ficha-simular:disabled {
  background-color: rgb(255 255 255 / 8%);
  color: var(--color-gray-txt3-dark);
  cursor: not-allowed;
}

.ficha-simular:focus-visible {
  outline: 2px solid var(--color-white-txt1);
  outline-offset: 2px;
}
</style>
