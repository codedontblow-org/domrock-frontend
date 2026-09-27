<script setup lang="ts">
// Botão só com ícone. A dica aparece no hover e no foco do teclado, e também é o nome
// acessível do botão, então quem usa leitor de tela ouve o mesmo texto.
withDefaults(
  defineProps<{
    icone: string
    dica: string
    lado?: 'esquerda' | 'baixo'
  }>(),
  { lado: 'esquerda' },
)

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button type="button" class="botao-icone" :aria-label="dica" @click="emit('click')">
    <i :class="icone" aria-hidden="true" />
    <span class="botao-icone-dica" :class="`dica--${lado}`" role="tooltip">{{ dica }}</span>
  </button>
</template>

<style scoped>
.botao-icone {
  position: relative;
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--color-gray-txt2-dark);
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.botao-icone:hover,
.botao-icone:focus-visible {
  background-color: rgb(255 255 255 / 8%);
  color: var(--color-white-txt1);
}

.botao-icone:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 1px;
}

.botao-icone-dica {
  position: absolute;
  z-index: 10;
  padding: 5px 8px;
  border-radius: 6px;
  background-color: var(--color-white-txt1);
  color: var(--color-black-bg1);
  font-family: var(--font-raleway);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s;
}

.dica--esquerda {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

.dica--baixo {
  top: calc(100% + 6px);
  right: 0;
}

.botao-icone:hover .botao-icone-dica,
.botao-icone:focus-visible .botao-icone-dica {
  opacity: 1;
  transition-delay: 0.25s;
}

@media (prefers-reduced-motion: reduce) {
  .botao-icone,
  .botao-icone-dica {
    transition: none;
  }
}
</style>
