<script setup lang="ts">
// Alerta de falha dentro dos modais (protótipo 2023:3394): Background1, borda Vermelho e texto em Texto2.
defineProps<{ mensagem: string }>()
</script>

<template>
  <div
    role="alert"
    class="flex items-start gap-2.5 rounded-[3px] border border-red bg-black-bg1 p-2.5"
  >
    <i class="bi bi-exclamation-triangle text-[15px] leading-4 text-red" aria-hidden="true"></i>
    <p class="flex-1 font-label text-[14px] text-gray-txt2-dark">{{ mensagem }}</p>
  </div>
</template>
