<script setup lang="ts">
import { formatarTrecho } from '../formatacao'
import { rotuloCargo, rotuloMarca } from '../rotulos'
import type { ConflitoCampanha, StatusConflito } from '../types'

// Alerta de conflito entre campanhas com períodos/marcas sobrepostos (A6-74 e A6-75).
defineProps<{ conflitos?: ConflitoCampanha[] }>()

function statusLegivel(status: StatusConflito): string {
  return status === 'APROVADA' ? 'aprovada' : 'aguardando aprovação'
}

function marcasFormatadas(marcas: string[]): string {
  return marcas.map(rotuloMarca).join(', ')
}

function cargosFormatados(cargos: string[]): string {
  return cargos.map(rotuloCargo).join(', ')
}

function chaveConflito(conflito: ConflitoCampanha): string {
  return `${conflito.campanha_id ?? conflito.nome}-${conflito.sobreposicao.data_inicio}-${conflito.sobreposicao.data_fim}`
}
</script>

<template>
  <div v-if="conflitos && conflitos.length > 0" class="avisos" role="status">
    <p v-for="conflito in conflitos" :key="chaveConflito(conflito)">
      <i class="bi bi-exclamation-triangle" aria-hidden="true" />
      Esta campanha se sobrepõe a {{ conflito.nome }} ({{ statusLegivel(conflito.status) }}) em
      {{ formatarTrecho(conflito.sobreposicao.data_inicio, conflito.sobreposicao.data_fim) }} para marcas
      {{ marcasFormatadas(conflito.marcas) }}, cargos {{ cargosFormatados(conflito.cargos) }}.
    </p>
  </div>
</template>

<style scoped>
.avisos {
  padding: 12px;
  border-left: 2px solid var(--color-yellow);
  background: color-mix(in srgb, var(--color-yellow) 10%, transparent);
  color: var(--color-yellow);
  font-size: 13px;
  line-height: 1.6;
}

.avisos p + p {
  margin-top: 8px;
}
</style>
