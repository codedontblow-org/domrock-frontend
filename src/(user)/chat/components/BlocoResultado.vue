<script setup lang="ts">
import { useId } from 'vue'
import type { SeloResultado } from '../resultado'

// Um bloco do resultado (A6-72): título, selo opcional e o número principal com a legenda ao lado.
defineProps<{ titulo: string; selo?: SeloResultado; destaque?: string; legenda?: string }>()
const idTitulo = useId()
</script>

<template>
  <section class="bloco" :aria-labelledby="idTitulo">
    <header class="bloco-topo">
      <h3 :id="idTitulo" class="bloco-titulo">{{ titulo }}</h3>
      <span v-if="selo" class="bloco-selo" :class="`selo--${selo.tom}`">{{ selo.texto }}</span>
    </header>
    <p v-if="destaque" class="bloco-destaque">
      {{ destaque }}<span v-if="legenda" class="bloco-legenda">{{ legenda }}</span>
    </p>
    <slot />
  </section>
</template>

<style scoped>
.bloco {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 0;
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.bloco-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bloco-titulo {
  font-size: 18px;
  font-weight: 500;
}

.bloco-selo {
  padding: 3px 10px;
  border-radius: 999px;
  font-family: var(--font-inconsolata);
  font-size: 14px;
  white-space: nowrap;
}

.selo--positivo {
  background-color: color-mix(in srgb, var(--color-green) 14%, transparent);
  color: var(--color-green);
}

.selo--aviso {
  background-color: color-mix(in srgb, var(--color-orange) 14%, transparent);
  color: var(--color-orange);
}

.selo--negativo {
  background-color: color-mix(in srgb, var(--color-red) 14%, transparent);
  color: var(--color-red);
}

.selo--neutro {
  background-color: color-mix(in srgb, var(--color-gray-txt2-dark) 14%, transparent);
  color: var(--color-gray-txt2-dark);
}

.bloco-destaque {
  font-family: var(--font-forum);
  font-size: 44px;
  line-height: 1;
}

.bloco-legenda {
  margin-left: 10px;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 16px;
}

@media (max-width: 560px) {
  .bloco-destaque {
    font-size: 36px;
  }
}
</style>
