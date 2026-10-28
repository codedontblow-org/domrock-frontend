<script setup lang="ts">
import { computed, ref } from 'vue'
import ParametroCampo from './ParametroCampo.vue'
import { ROTULOS_CURTOS_PARAMETRO } from '../rotulos'
import { estaVazio } from '../stores/chat'
import type { ParametroRegra, RegraCampanha, ValorParametro } from '../types'

// Painel de simulação da campanha (tab-simulacao, nós 641:1848 e 641:1860; Leo, 28/10).
// O cabeçalho passa a se chamar "Simulação" com botão X de fechar (28x28).
const props = defineProps<{
  regra: RegraCampanha
  camposVazios: string[]
  podeSimular: boolean
  simulando: boolean
  ocupado: boolean
}>()

const emit = defineEmits<{
  alterar: [key: string, valor: ValorParametro]
  simular: []
  fechar: []
}>()

const comandoAberto = ref(false)
const regras = computed(() => props.regra.parametros.filter((p) => p.categoria === 'REGRA'))
const limites = computed(() => props.regra.parametros.filter((p) => p.categoria === 'CONSTRAINT'))

// Orçamento é opcional (A6-72): entra por "Adicionar orçamento" em Extras, como no Figma do time.
const obrigatorios = computed(() => limites.value.filter((p) => p.required))
const opcionais = computed(() => limites.value.filter((p) => !p.required))
const extrasAbertos = ref<ReadonlySet<string>>(new Set())
const extrasVisiveis = computed(() => opcionais.value.filter(extraVisivel))

function extraVisivel(parametro: ParametroRegra): boolean {
  return !estaVazio(parametro.value) || extrasAbertos.value.has(parametro.key)
}

function abrirExtra(key: string): void {
  extrasAbertos.value = new Set([...extrasAbertos.value, key])
}

function tirarExtra(key: string): void {
  extrasAbertos.value = new Set([...extrasAbertos.value].filter((aberto) => aberto !== key))
  emit('alterar', key, null)
}

/** Ex.: orcamento_limite -> "orçamento" */
function rotuloDoExtra(parametro: ParametroRegra): string {
  return (ROTULOS_CURTOS_PARAMETRO[parametro.key] ?? parametro.label).toLowerCase()
}
const pendentes = computed<number>(() => props.camposVazios.length)

const status = computed<string>(() => {
  if (pendentes.value === 0) return 'Pronta para simular'
  return pendentes.value === 1 ? '1 pendente' : `${pendentes.value} pendentes`
})

const aviso = computed<string>(() => {
  if (props.simulando) return 'Gerando o código da regra e simulando sobre os dados reais.'
  if (pendentes.value > 0) return 'Preencha os campos em laranja para simular.'
  return 'A simulação usa exatamente os valores acima.'
})
</script>

<template>
  <section class="ficha" aria-labelledby="ficha-titulo">
    <!-- Cabeçalho (641:1848): título "Simulação" 24px e botão X (28x28) -->
    <header class="ficha-cabecalho">
      <h2 id="ficha-titulo" class="ficha-titulo">Simulação</h2>
      <span class="sr-only ficha-status">{{ status }}</span>
      <button
        type="button"
        class="ficha-fechar"
        aria-label="Fechar o painel de simulação"
        @click="emit('fechar')"
      >
        <i class="bi bi-x-lg" aria-hidden="true" />
      </button>
    </header>

    <button
      v-if="regra.raw_prompt"
      type="button"
      class="ficha-comando"
      :class="{ 'ficha-comando--aberto': comandoAberto }"
      :aria-expanded="comandoAberto"
      :title="comandoAberto ? 'Recolher o comando' : 'Ver o comando completo'"
      @click="comandoAberto = !comandoAberto"
    >
      {{ regra.raw_prompt }}
    </button>

    <div class="ficha-corpo">
      <div class="ficha-grupo" aria-label="Regra">
        <ParametroCampo v-for="p in regras" :key="p.key" :parametro="p" @alterar="emit('alterar', p.key, $event)" />
      </div>
      <div class="ficha-grupo ficha-grupo--limites" aria-label="Limites">
        <ParametroCampo v-for="p in obrigatorios" :key="p.key" :parametro="p" @alterar="emit('alterar', p.key, $event)" />

        <div v-if="opcionais.length" class="ficha-extras" role="group" aria-labelledby="ficha-extras-titulo">
          <p id="ficha-extras-titulo" class="ficha-extras-titulo">Extras</p>
          <div class="ficha-extras-botoes">
            <button
              v-for="p in opcionais"
              :key="p.key"
              type="button"
              class="extra-adicionar"
              :disabled="extraVisivel(p)"
              @click="abrirExtra(p.key)"
            >
              <i class="bi bi-plus-circle" aria-hidden="true" />Adicionar {{ rotuloDoExtra(p) }}
            </button>
          </div>
          <ParametroCampo
            v-for="p in extrasVisiveis"
            :key="p.key"
            :parametro="p"
            removivel
            @alterar="emit('alterar', p.key, $event)"
            @remover="tirarExtra(p.key)"
          />
        </div>
      </div>
    </div>

    <!-- Rodapé: botão "Simular Campanha" preso embaixo (641:1860) -->
    <footer class="ficha-rodape">
      <button
        type="button"
        class="ficha-simular"
        :disabled="!podeSimular"
        @click="emit('simular')"
      >
        {{ simulando ? 'Simulando…' : 'Simular Campanha' }}
      </button>
      <p v-if="pendentes > 0 || simulando" class="ficha-aviso" aria-live="polite">{{ aviso }}</p>
    </footer>
  </section>
</template>

<style scoped>
/* Ocupa a coluna inteira do painel tab-simulacao (nó 641:1860) */
.ficha {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.ficha-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

/* Título "Simulação" em Raleway Medium 24px, line-height 28px, Texto1 (641:1848) */
.ficha-titulo {
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-weight: 500;
  font-size: 24px;
  line-height: 28px;
  margin: 0;
}

/* Botão X de fechar: 28x28, ícone bi-x-lg (641:1848) */
.ficha-fechar {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-white-txt1);
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  transition: background-color 0.15s, color 0.15s;
}

.ficha-fechar:hover {
  background-color: rgb(255 255 255 / 8%);
}

.ficha-fechar:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}

/* O comando original fica em 3 linhas; um clique mostra inteiro */
.ficha-comando {
  display: -webkit-box;
  margin: 16px 0 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  font-style: italic;
  line-height: 1.45;
  text-align: left;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  cursor: pointer;
  flex-shrink: 0;
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
  margin-top: 24px;
  margin-bottom: 24px;
  padding-right: 4px;
  overflow-y: auto;
}

.ficha-grupo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* A meta, e embaixo os Extras com o orçamento opcional (A6-72) */
.ficha-grupo--limites {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.ficha-extras {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ficha-extras-titulo {
  color: var(--color-white-txt1);
  font-size: 15px;
  font-weight: 500;
}

.ficha-extras-botoes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.extra-adicionar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: none;
  border-radius: 999px;
  background-color: var(--color-black-bg1);
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.extra-adicionar:hover:not(:disabled) {
  background-color: rgb(255 255 255 / 8%);
}

.extra-adicionar:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}

/* Já na ficha: o botão fica apagado, como o "Adicionar Meta" do Figma do time */
.extra-adicionar:disabled {
  background-color: transparent;
  color: var(--color-gray-txt3-dark);
  cursor: default;
}

.ficha-rodape {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Botão "Simular Campanha" pill preso no rodapé (641:1860) */
.ficha-simular {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 100px;
  background-color: var(--color-blue);
  color: var(--color-black-bg1);
  font-family: var(--font-raleway);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
}

.ficha-simular:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-blue) 85%, white);
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
  margin: 0;
  color: var(--color-gray-txt3-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
}
</style>
