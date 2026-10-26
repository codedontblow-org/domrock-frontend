<script setup lang="ts">
import type { Severidade } from '../types'

// severidade-tag do protótipo (2003:1638): borda e texto na cor, fundo da mesma cor a 12%.
// IMPEDITIVO em Vermelho; AVISO em Laranja (a paleta não tem amarelo).
const props = defineProps<{ severidade: Severidade }>()

const CORES: Record<Severidade, string> = {
  IMPEDITIVO: 'border-red bg-red/12 text-red',
  AVISO: 'border-orange bg-orange/12 text-orange',
}
</script>

<template>
  <span class="inline-flex items-center rounded-[3px] border px-2 py-[3px] font-label text-[14px]" :class="CORES[props.severidade]">
    {{ props.severidade }}
  </span>
</template>
