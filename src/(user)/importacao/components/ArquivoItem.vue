<script setup lang="ts">
import { formatarTamanho } from '../formatacao'

// arquivo-item do protótipo (2003:1644): planilha escolhida para o envio. O "remover" some depois de
// enviar (confirmação e andamento).
const props = withDefaults(defineProps<{ nome: string; tamanho: number; podeRemover?: boolean }>(), {
  podeRemover: false,
})

const emit = defineEmits<{ remover: [] }>()
</script>

<template>
  <div class="flex items-center gap-3 rounded-[5px] bg-black-bg1 px-4 py-3">
    <i class="bi bi-file-earmark-spreadsheet text-[20px] leading-5 text-green" aria-hidden="true"></i>
    <span class="min-w-0 flex-1 truncate font-label text-[14px] text-white-txt1">{{ props.nome }}</span>
    <span class="font-label text-[12px] font-light! whitespace-nowrap text-gray-txt3-dark">
      {{ formatarTamanho(props.tamanho) }}
    </span>
    <button
      v-if="props.podeRemover"
      type="button"
      class="flex size-5 items-center justify-center rounded-[3px] text-gray-txt3-dark transition-colors hover:text-white-txt1 focus-visible:outline-2 focus-visible:outline-blue"
      :aria-label="`Remover ${props.nome}`"
      @click="emit('remover')"
    >
      <i class="bi bi-x-lg text-[14px] leading-none" aria-hidden="true"></i>
    </button>
  </div>
</template>
