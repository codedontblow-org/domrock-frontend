<script setup lang="ts">
// progresso-importacao do protótipo (2003:1682): barra indeterminada, porque o backend não informa
// porcentagem. Desliza da esquerda para a direita em loop, de Azul para Verde.
</script>

<template>
  <div
    class="relative h-1.5 w-full overflow-hidden rounded-[3px] bg-black-bg1"
    role="progressbar"
    aria-label="Importação em andamento"
  >
    <div class="barra absolute top-0 left-0 h-1.5 w-[30%] rounded-[3px] bg-linear-to-r from-blue to-green"></div>
  </div>
</template>

<style scoped>
@keyframes deslizar {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(340%);
  }
}

.barra {
  animation: deslizar 1.6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .barra {
    width: 100%;
    animation: none;
    opacity: 0.5;
  }
}
</style>
