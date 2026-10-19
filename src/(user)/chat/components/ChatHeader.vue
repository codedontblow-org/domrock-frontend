<script setup lang="ts">
import { formatarData } from '../resumo'
defineProps<{ nome: string; data: string; podePublicar: boolean; painelAberto: boolean }>()
defineEmits<{ publicar: []; parametros: [] }>()
</script>
<template>
  <header class="chat-header">
    <div class="titulo">
      <h1 :title="nome">{{ nome }}</h1>
      <p>{{ formatarData(data) }}</p>
    </div>
    <button
      type="button"
      aria-label="Alternar parâmetros da campanha"
      :aria-expanded="painelAberto"
      @click="$emit('parametros')"
    >
      <i class="bi bi-sliders" aria-hidden="true" />
    </button>
    <button type="button" :disabled="!podePublicar" @click="$emit('publicar')">
      <i class="bi bi-cloud-arrow-up-fill" aria-hidden="true" /> Publicar Campanha
    </button>
  </header>
</template>
<style scoped>
.chat-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-black-bg2);
  margin-bottom: 20px;
}
.titulo {
  min-width: 0;
  flex: 1;
}
h1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 600 16px var(--font-inconsolata);
}
p {
  font: 12px var(--font-inconsolata);
  color: var(--color-gray-txt2-dark);
}
button {
  padding: 8px 12px;
  border-radius: 4px;
  background: var(--color-black-bg2);
  color: var(--color-white-txt1);
  cursor: pointer;
  font: 13px var(--font-raleway);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
button:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 3px;
}
@media (max-width: 520px) {
  .chat-header {
    flex-wrap: wrap;
  }
  .titulo {
    flex-basis: 70%;
  }
}
</style>
