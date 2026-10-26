<script setup lang="ts">
import type { NumeroResultado } from '../resultado'

// Números de apoio de um bloco, como no painel "Visualizando Campanha": rótulo em cima, valor embaixo.
defineProps<{ itens: NumeroResultado[] }>()
</script>

<template>
  <dl class="numeros">
    <div v-for="item in itens" :key="item.rotulo" class="numero">
      <dt class="numero-rotulo">{{ item.rotulo }}</dt>
      <dd class="numero-valor">{{ item.valor }}</dd>
      <dd v-if="item.apoio" class="numero-apoio" :class="item.tomApoio && `tom--${item.tomApoio}`">
        {{ item.apoio }}
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.numeros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, max-content));
  gap: 16px 40px;
  font-family: var(--font-inconsolata);
}

.numero-rotulo {
  color: var(--color-gray-txt2-dark);
  font-size: 12px;
}

.numero-valor {
  margin-top: 4px;
  font-size: 14px;
}

.numero-apoio {
  margin-top: 2px;
  color: var(--color-gray-txt3-dark);
  font-size: 12px;
}

.tom--destaque {
  color: var(--color-blue);
}
</style>
