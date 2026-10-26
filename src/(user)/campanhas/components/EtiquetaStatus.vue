<script setup lang="ts">
import { useStatusCampanha } from '../useStatusCampanha'
import type { StatusCampanha } from '../types'

const props = defineProps<{
  status: StatusCampanha
  vigencia?: 'Vigente' | 'Encerrada' | null
}>()

const { descreverStatus } = useStatusCampanha()
const desc = descreverStatus(props.status)
</script>

<template>
  <span class="etiqueta-grupo">
    <span class="etiqueta" :class="desc.cor">
      <i :class="desc.icone" aria-hidden="true" />
      {{ desc.label }}
    </span>
    <span v-if="vigencia" class="etiqueta etiqueta--vigencia" :class="vigencia === 'Vigente' ? 'etiqueta--vigente' : 'etiqueta--encerrada'">
      {{ vigencia }}
    </span>
  </span>
</template>

<style scoped>
.etiqueta-grupo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.etiqueta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 999px;
  font-family: var(--font-raleway);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.status--rascunho {
  background-color: rgb(169 173 181 / 15%);
  color: var(--color-gray-txt2-dark);
}

.status--aguardando {
  background-color: rgb(250 163 83 / 15%);
  color: var(--color-orange);
}

.status--aprovada {
  background-color: rgb(100 192 115 / 15%);
  color: var(--color-green);
}

.status--reprovada {
  background-color: rgb(240 98 96 / 15%);
  color: var(--color-red);
}

.status--arquivada {
  background-color: rgb(169 173 181 / 10%);
  color: var(--color-gray-txt3-dark);
}

.etiqueta--vigencia {
  font-size: 11px;
  font-weight: 500;
}

.etiqueta--vigente {
  background-color: rgb(100 192 115 / 10%);
  color: var(--color-green);
}

.etiqueta--encerrada {
  background-color: rgb(169 173 181 / 10%);
  color: var(--color-gray-txt3-dark);
}
</style>
