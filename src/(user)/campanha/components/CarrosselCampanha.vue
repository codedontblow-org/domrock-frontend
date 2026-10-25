<script setup lang="ts">
import { computed, ref } from 'vue'
import ListaCampanha from './ListaCampanha.vue'
import type { CampanhaAprovacao } from '../types'

const props = defineProps<{
  campanhas: CampanhaAprovacao[]
  selecionavel?: boolean
}>()

const emit = defineEmits<{
  selecionar: [campanha: CampanhaAprovacao]
}>()

function selecionar(campanha: CampanhaAprovacao) {
  if (props.selecionavel) emit('selecionar', campanha)
}

const carrossel = ref<HTMLElement | null>(null)
const indiceAtual = ref(0)

const totalCampanhas = computed(() => props.campanhas.length)

const posicaoAtual = computed(() => {
  if (totalCampanhas.value === 0) return 0

  return Math.min(indiceAtual.value + 2, totalCampanhas.value)
})

function atualizarPosicao() {
  const elemento = carrossel.value

  if (!elemento) return

  const primeiroCard = elemento.querySelector(
    '.campanha-card',
  ) as HTMLElement | null

  if (!primeiroCard) return

  const estilos = window.getComputedStyle(elemento)
  const gap = Number.parseFloat(estilos.columnGap) || 0
  const larguraCard = primeiroCard.offsetWidth + gap

  indiceAtual.value = Math.round(elemento.scrollLeft / larguraCard)
}

function avancar() {
  const elemento = carrossel.value

  if (!elemento || totalCampanhas.value === 0) return

  const primeiroCard = elemento.querySelector(
    '.campanha-card',
  ) as HTMLElement | null

  if (!primeiroCard) return

  const estilos = window.getComputedStyle(elemento)
  const gap = Number.parseFloat(estilos.columnGap) || 0
  const larguraCard = primeiroCard.offsetWidth + gap

  const chegouAoFim =
    elemento.scrollLeft + elemento.clientWidth >=
    elemento.scrollWidth - 5

  if (chegouAoFim) {
    elemento.scrollTo({
      left: 0,
      behavior: 'smooth',
    })
  } else {
    elemento.scrollBy({
      left: larguraCard,
      behavior: 'smooth',
    })
  }

}
</script>

<template>
  <section class="carrossel-campanhas">
    <header class="carrossel-header">
      <div class="carrossel-info">
        <i class="bi bi-arrows-angle-expand carrossel-header-icon"></i>

        <span>
          Visualizando {{ posicaoAtual }}/{{ totalCampanhas }} campanhas
        </span>
      </div>

      <button
        v-if="totalCampanhas > 0"
        type="button"
        class="carrossel-seta"
        aria-label="Avançar para a próxima campanha"
        :disabled="
          indiceAtual >= totalCampanhas - 1 ||
          !carrossel ||
          carrossel.scrollWidth <= carrossel.clientWidth
        "
        @click="avancar"
      >
        <i class="bi bi-arrow-right"></i>
      </button>
    </header>

    <div
      ref="carrossel"
      class="carrossel-lista"
      @scroll="atualizarPosicao"
    >
      <article
        v-for="campanha in campanhas"
        :key="campanha.id"
        class="campanha-card"
        :class="{ 'campanha-card--selecionavel': selecionavel }"
        :role="selecionavel ? 'button' : undefined"
        :tabindex="selecionavel ? 0 : undefined"
        :aria-label="selecionavel ? `Ver detalhes da campanha ${campanha.titulo}` : undefined"
        @click="selecionar(campanha)"
        @keydown.enter.prevent="selecionar(campanha)"
        @keydown.space.prevent="selecionar(campanha)"
      >
        <ListaCampanha
          :titulo="campanha.titulo"
          :inicio="campanha.inicio"
          :fim="campanha.fim"
          :percentual="campanha.percentual"
          :alcance="campanha.alcance"
          :custo="campanha.custo"
          :custo-detalhe="campanha.custoDetalhe"
          :sugerido-por="campanha.sugeridoPor"
          :submetido-em="campanha.submetidoEm"
          :status="campanha.status"
        />
      </article>
    </div>
  </section>
</template>

<style scoped>
.carrossel-campanhas {
  width: 100%;
  min-width: 0;
  font-family: var(--font-raleway);
  color: var(--color-white-txt1);
}

.carrossel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.carrossel-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  line-height: var(--text-label--line-height);
}

.carrossel-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 2px;
  font-size: 12px;
}

.carrossel-lista {
  display: flex;
  gap: 20px;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  scroll-snap-type: x mandatory;
}

.carrossel-lista::-webkit-scrollbar {
  display: none;
}

.campanha-card {
  flex: 0 0 min(calc((100% - 8px) / 2.5), 500px);
  min-width: 280px;
  scroll-snap-align: start;
}

.campanha-card--selecionavel {
  cursor: pointer;
}

.campanha-card--selecionavel:focus-visible {
  outline: none;
}

.campanha-card--selecionavel :deep(.approval-card) {
  transition: border-color 0.2s ease;
}

.campanha-card--selecionavel:hover :deep(.approval-card),
.campanha-card--selecionavel:focus-visible :deep(.approval-card) {
  border-color: var(--color-blue);
}

.carrossel-seta {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 8px;
  background-color: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font-size: 18px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.carrossel-seta:hover:not(:disabled) {
  border-color: var(--color-blue);
  background-color: var(--color-black-bg1);
}

.carrossel-seta:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 1366px) {
  .campanha-card {
    flex-basis: min(calc((100% - 4px) / 2), 500px);
    min-width: 260px;
  }
}

@media (max-width: 900px) {
  .campanha-card {
    flex-basis: calc((100% - 4px) / 1.5);
  }
}

@media (max-width: 600px) {
  .campanha-card {
    flex: 0 0 85%;
    min-width: 0;
  }

  .carrossel-seta {
    width: 36px;
    height: 36px;
  }
}
</style>
