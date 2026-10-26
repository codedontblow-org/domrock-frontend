<script setup lang="ts">
import EtiquetaStatus from './EtiquetaStatus.vue'
import type { StatusCampanha } from '../../campanha/types'

// Só mostra a campanha da conversa: salvar e enviar ficam no painel da ficha (decisão do PO, 26/10).
defineProps<{
  nome: string
  status: StatusCampanha
  versao: number | null
}>()
</script>

<template>
  <div class="resumo-campanha">
    <span class="resumo-campanha-nome">{{ nome }}</span>
    <EtiquetaStatus :status="status" />
    <span v-if="versao !== null" class="resumo-campanha-versao">v{{ versao }}</span>
  </div>
</template>

<style scoped>
.resumo-campanha {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 0;
}

.resumo-campanha-nome {
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resumo-campanha-versao {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: 12px;
  white-space: nowrap;
}
</style>
