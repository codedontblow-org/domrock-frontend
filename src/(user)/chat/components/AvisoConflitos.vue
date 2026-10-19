<script setup lang="ts">
import type { ConflitoCampanha } from '../types'
import { formatarData } from '../resumo'
defineProps<{ conflitos?: ConflitoCampanha[] }>()
</script>
<template>
  <div v-if="conflitos?.length" class="avisos" role="status">
    <p v-for="conflito in conflitos" :key="conflito.id">
      <i class="bi bi-exclamation-triangle" aria-hidden="true" />
      Esta campanha se sobrepõe a {{ conflito.nome }} (aprovada) em
      {{ formatarData(conflito.inicio) }} a {{ formatarData(conflito.fim) }} para marca
      {{ conflito.marca }}, cargos {{ conflito.cargos.join(', ') }}.
    </p>
  </div>
</template>
<style scoped>
.avisos {
  padding: 12px;
  border-left: 2px solid #eab308;
  background: rgb(234 179 8 / 8%);
  color: #facc15;
  font-size: 13px;
  line-height: 1.6;
}
.avisos p + p {
  margin-top: 8px;
}
</style>
