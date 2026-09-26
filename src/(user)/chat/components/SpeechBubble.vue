<script setup lang="ts">
import { computed } from 'vue'
import { renderizarMarkdown } from '../formatacao'
import type { PapelMensagem } from '../types'

const props = withDefaults(
  defineProps<{
    message?: string
    papel?: PapelMensagem
  }>(),
  {
    message: '',
    papel: 'usuario',
  },
)

// Só a Lana responde em Markdown; o texto do usuário é exibido literalmente.
const html = computed(() => (props.papel === 'agente' ? renderizarMarkdown(props.message) : ''))
</script>

<template>
  <div v-if="papel === 'agente'" class="speech-bubble speech-bubble--agente" v-html="html" />
  <div v-else class="speech-bubble" :class="`speech-bubble--${papel}`" :role="papel === 'erro' ? 'alert' : undefined">
    {{ message }}
  </div>
</template>

<style scoped>
  .speech-bubble {
    display: inline-block;
    max-width: 448px;
    align-self: flex-end;
    padding: 8px 12px;
    border-radius: 6px 6px 0 6px;
    background-color: var(--color-blue);
    color: var(--color-white-txt1);
    font-family: var(--font-inconsolata);
    font-size: 12px;
    line-height: 1.2;
    white-space: pre-wrap;
  }

  .speech-bubble--agente {
    align-self: flex-start;
    max-width: 620px;
    padding: 4px 0;
    border-radius: 0;
    background-color: transparent;
    color: var(--color-white-txt1);
    font-family: var(--font-raleway);
    font-size: 15px;
    line-height: 1.6;
    white-space: normal;
  }

  .speech-bubble--agente :deep(p + p),
  .speech-bubble--agente :deep(ul),
  .speech-bubble--agente :deep(ol) {
    margin-top: 10px;
  }

  .speech-bubble--agente :deep(ul),
  .speech-bubble--agente :deep(ol) {
    padding-left: 20px;
  }

  .speech-bubble--agente :deep(strong) {
    font-weight: 700;
  }

  .speech-bubble--erro {
    align-self: flex-start;
    max-width: 620px;
    border-radius: 6px;
    background-color: transparent;
    box-shadow: inset 3px 0 0 var(--color-red);
    color: var(--color-white-txt1);
    font-family: var(--font-raleway);
    font-size: 14px;
    line-height: 1.5;
  }
</style>
