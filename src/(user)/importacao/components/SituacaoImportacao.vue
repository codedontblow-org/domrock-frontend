<script setup lang="ts">
import type { SituacaoDoMes } from '../stores/importacao'

// situacao-importacao do protótipo (2003:1633): ponto de 8px na cor da situação e o rótulo em
// Label/Texto2. "Na fila" e "Não enviado" são da fila de meses, que o protótipo não tem: ficam em Texto3.
const props = defineProps<{ situacao: SituacaoDoMes }>()

const VISUAL: Record<SituacaoDoMes, { rotulo: string; ponto: string }> = {
  PROCESSANDO: { rotulo: 'Processando', ponto: 'bg-blue' },
  CONCLUIDO: { rotulo: 'Concluída', ponto: 'bg-green' },
  PENDENTE: { rotulo: 'Pendente', ponto: 'bg-red' },
  FALHA: { rotulo: 'Falha', ponto: 'bg-red' },
  NA_FILA: { rotulo: 'Na fila', ponto: 'bg-gray-txt3-dark' },
  NAO_ENVIADO: { rotulo: 'Não enviado', ponto: 'bg-gray-txt3-dark' },
}
</script>

<template>
  <span class="inline-flex items-center gap-2 font-label text-[14px] whitespace-nowrap text-gray-txt2-dark">
    <span class="size-2 shrink-0 rounded-full" :class="VISUAL[props.situacao].ponto" aria-hidden="true"></span>
    {{ VISUAL[props.situacao].rotulo }}
  </span>
</template>
