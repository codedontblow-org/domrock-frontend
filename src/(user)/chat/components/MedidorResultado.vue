<script setup lang="ts">
import { computed } from 'vue'
import type { MedidorResultado } from '../resultado'

// Barra de um bloco do resultado. Com `marca`, um traço mostra onde fica a meta.
const props = defineProps<{ medidor: MedidorResultado; descricao: string }>()

const largura = computed(() => `${props.medidor.proporcao * 100}%`)
const posicaoMarca = computed(() => (props.medidor.marca === null ? null : `${props.medidor.marca * 100}%`))
</script>

<template>
  <div class="medidor" :class="{ 'medidor--com-marca': posicaoMarca }" role="img" :aria-label="descricao">
    <div class="medidor-trilho">
      <div class="medidor-preenchido" :class="`tom--${medidor.tom}`" :style="{ width: largura }" />
    </div>
    <template v-if="posicaoMarca">
      <span class="medidor-marca" :style="{ left: posicaoMarca }" aria-hidden="true" />
      <span class="medidor-rotulo" :style="{ left: posicaoMarca }" aria-hidden="true">meta</span>
    </template>
  </div>
</template>

<style scoped>
.medidor {
  position: relative;
}

.medidor--com-marca {
  padding-bottom: 18px;
}

.medidor-trilho {
  height: 8px;
  border-radius: 999px;
  background-color: rgb(255 255 255 / 8%);
  overflow: hidden;
}

.medidor-preenchido {
  height: 100%;
  border-radius: inherit;
  transition: width 0.8s ease-out;
}

.tom--positivo {
  background-color: var(--color-green);
}

.tom--aviso {
  background-color: var(--color-orange);
}

.tom--negativo {
  background-color: var(--color-red);
}

.medidor-marca {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 14px;
  background-color: var(--color-white-txt1);
  transform: translateX(-1px);
}

.medidor-rotulo {
  position: absolute;
  top: 14px;
  color: var(--color-gray-txt3-dark);
  font-family: var(--font-inconsolata);
  font-size: 12px;
  transform: translateX(-50%);
}

@media (prefers-reduced-motion: reduce) {
  .medidor-preenchido {
    transition: none;
  }
}
</style>
