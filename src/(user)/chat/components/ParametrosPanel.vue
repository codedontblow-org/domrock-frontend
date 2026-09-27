<script setup lang="ts">
import { computed, ref } from 'vue'
import BotaoIcone from '@/components/BotaoIcone.vue'
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
  recolher: []
}>()

const comandoAberto = ref(false)
const regras = computed(() => props.regra.parametros.filter((p) => p.categoria === 'REGRA'))
const limites = computed(() => props.regra.parametros.filter((p) => p.categoria === 'CONSTRAINT'))
const pendentes = computed(() => props.camposVazios.length)

const status = computed(() => {
  if (pendentes.value === 0) return 'Pronta para simular'
  return pendentes.value === 1 ? '1 pendente' : `${pendentes.value} pendentes`
})

const aviso = computed(() => {
  if (props.simulando) return 'Gerando o código da regra e simulando sobre os dados reais.'
  if (pendentes.value > 0) return 'Preencha os campos em laranja para simular.'
  return 'A simulação usa exatamente os valores acima.'
})
</script>

<template>
  <section class="ficha" aria-labelledby="ficha-titulo">
    <header class="ficha-cabecalho">
      <h2 id="ficha-titulo" class="ficha-titulo">Campanha</h2>
      <span class="ficha-status" :class="pendentes ? 'ficha-status--pendente' : 'ficha-status--pronta'">
        {{ status }}
      </span>
      <BotaoIcone class="ficha-recolher" icone="bi bi-layout-sidebar-inset-reverse" dica="Recolher o painel"
        lado="baixo" @click="emit('recolher')" />
    </header>

    <button v-if="regra.raw_prompt" type="button" class="ficha-comando"
      :class="{ 'ficha-comando--aberto': comandoAberto }" :aria-expanded="comandoAberto"
      :title="comandoAberto ? 'Recolher o comando' : 'Ver o comando completo'" @click="comandoAberto = !comandoAberto">
      {{ regra.raw_prompt }}
    </button>

    <div class="ficha-corpo">
      <div class="ficha-grupo" aria-label="Regra">
        <ParametroCampo v-for="p in regras" :key="p.key" :parametro="p" @alterar="emit('alterar', p.key, $event)" />
      </div>
      <div class="ficha-grupo ficha-grupo--limites" aria-label="Limites">
        <ParametroCampo v-for="p in limites" :key="p.key" :parametro="p" @alterar="emit('alterar', p.key, $event)" />
      </div>
    </div>

    <footer class="ficha-rodape">
      <button type="button" class="ficha-simular" :disabled="!podeSimular" @click="emit('simular')">
        {{ simulando ? 'Simulando…' : 'Simular campanha' }}
      </button>
      <p class="ficha-aviso" aria-live="polite">{{ aviso }}</p>
    </footer>
  </section>
</template>

<style scoped>
/* Ocupa a altura da janela: os campos respiram e o botão Simular fica sempre no rodapé. */
.ficha {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 32px);
  border-radius: 8px;
  background-color: var(--color-black-bg2);
  overflow: hidden;
}

.ficha-cabecalho {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px 0 16px;
}

.ficha-titulo {
  flex: 1;
  color: var(--color-white-txt1);
  font-family: var(--font-forum);
  font-size: 26px;
  line-height: 1;
}

.ficha-status {
  font-family: var(--font-raleway);
  font-size: 12px;
  white-space: nowrap;
}

.ficha-status--pendente {
  color: var(--color-orange);
}

.ficha-status--pronta {
  color: var(--color-green);
}

/* O comando original fica em 2 linhas; um clique mostra inteiro. */
.ficha-comando {
  display: -webkit-box;
  margin: 8px 16px 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-gray-txt3-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
  font-style: italic;
  line-height: 1.45;
  text-align: left;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  cursor: pointer;
}

.ficha-comando--aberto {
  -webkit-line-clamp: unset;
  line-clamp: unset;
}

.ficha-comando:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}

.ficha-corpo {
  flex: 1;
  min-height: 0;
  margin-top: 14px;
  padding: 0 16px 16px;
  overflow-y: auto;
}

.ficha-grupo {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ficha-grupo--limites {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.ficha-rodape {
  padding: 12px 16px 14px;
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.ficha-simular {
  width: 100%;
  padding: 10px;
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

.ficha-aviso {
  margin-top: 8px;
  color: var(--color-gray-txt3-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
}
</style>
