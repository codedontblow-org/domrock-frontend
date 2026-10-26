<script setup lang="ts">
// TextButton do protótipo (Figma 90:257 e 95:392): "cheio" para a ação principal e "vazado"
// para a secundária. Desabilitado fica com 35% de opacidade, como no protótipo.
withDefaults(
  defineProps<{
    variante?: 'cheio' | 'vazado'
    cor?: 'azul' | 'vermelho' | 'verde'
    tipo?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variante: 'cheio', cor: 'azul', tipo: 'button', disabled: false },
)
</script>

<template>
  <button
    :type="tipo"
    class="botao-texto"
    :class="[`botao-texto--${variante}`, `botao-texto--${cor}`]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.botao-texto {
  --cor-botao: var(--color-blue);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 15px;
  border: 1px solid var(--cor-botao);
  border-radius: 5px;
  font-family: var(--font-raleway);
  font-size: 16px;
  line-height: 20px;
  white-space: nowrap;
  cursor: pointer;
  transition:
    filter 0.15s,
    background-color 0.15s;
}

.botao-texto--vermelho {
  --cor-botao: var(--color-red);
}

.botao-texto--verde {
  --cor-botao: var(--color-green);
}

.botao-texto--cheio {
  background-color: var(--cor-botao);
  color: var(--color-black-bg1);
}

.botao-texto--vazado {
  background-color: transparent;
  color: var(--cor-botao);
}

.botao-texto--cheio:hover:not(:disabled) {
  filter: brightness(1.1);
}

.botao-texto--vazado:hover:not(:disabled) {
  background-color: rgb(255 255 255 / 5%);
}

.botao-texto:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}

.botao-texto:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .botao-texto {
    transition: none;
  }
}
</style>
