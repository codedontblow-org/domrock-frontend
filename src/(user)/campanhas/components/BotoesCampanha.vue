<script setup lang="ts">
import { configAcao } from '../acoes'
import type { AcaoCampanha, StatusCampanha } from '../../campanha/types'

defineProps<{
  /** As `acoes` da Campanha (contrato 5.2): um botão por item, na ordem do backend. */
  acoes: AcaoCampanha[]
  status: StatusCampanha
  agindo: boolean
}>()

const emit = defineEmits<{
  acao: [acao: AcaoCampanha]
}>()
</script>

<template>
  <div class="botoes-campanha">
    <button
      v-for="acao in acoes"
      :key="acao"
      type="button"
      class="btn"
      :class="`btn--${configAcao(acao).variante}`"
      :disabled="agindo"
      @click="emit('acao', acao)"
    >
      <i :class="configAcao(acao).icone" aria-hidden="true" />
      {{ configAcao(acao).label }}
    </button>
    <!-- Sem rota até o A6-88 (cancelamento): o botão fica e não faz nada (decisão do PO, 26/10). -->
    <button v-if="status === 'APROVADA'" type="button" class="btn btn--perigo">
      <i class="bi bi-x-circle" aria-hidden="true" />
      Solicitar cancelamento
    </button>
  </div>
</template>

<style scoped>
.botoes-campanha {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  font-family: var(--font-raleway);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.btn--primario {
  background-color: var(--color-blue);
  color: var(--color-black-bg1);
}

.btn--secundario {
  background-color: rgb(255 255 255 / 10%);
  color: var(--color-white-txt1);
}

.btn--perigo {
  background-color: rgb(240 98 96 / 15%);
  color: var(--color-red);
}

.btn:disabled {
  background-color: rgb(255 255 255 / 6%);
  color: var(--color-gray-txt3-dark);
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  opacity: 0.85;
}

.btn:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}
</style>
