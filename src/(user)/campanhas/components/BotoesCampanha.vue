<script setup lang="ts">
import { computed } from 'vue'
import EtiquetaStatus from './EtiquetaStatus.vue'
import { acoesDisponiveis, configAcao } from '../acoes'
import type { AcaoCampanha, StatusCampanha } from '../types'

const props = defineProps<{
  podeSimular: boolean
  campanhaId: number | null
  status: StatusCampanha | null
  nome: string | null
  versao: number | null
  salvando: boolean
}>()

const emit = defineEmits<{
  salvar: []
  acao: [acao: AcaoCampanha]
}>()

const acoes = computed(() =>
  props.status ? acoesDisponiveis(props.status) : [],
)
</script>

<template>
  <div class="botoes-campanha">
    <template v-if="campanhaId === null">
      <button
        type="button"
        class="btn btn--salvar"
        :disabled="!podeSimular || salvando"
        @click="emit('salvar')"
      >
        <i class="bi bi-bookmark-plus" aria-hidden="true" />
        {{ salvando ? 'Salvando…' : 'Salvar campanha' }}
      </button>
    </template>

    <template v-else>
      <div class="campanha-info">
        <span class="campanha-nome">{{ nome }}</span>
        <EtiquetaStatus v-if="status" :status="status" />
        <span v-if="versao !== null" class="campanha-versao">v{{ versao }}</span>
      </div>

      <div class="campanha-acoes">
        <button
          v-for="acao in acoes"
          :key="acao"
          type="button"
          class="btn"
          :class="`btn--${configAcao(acao).variante}`"
          @click="emit('acao', acao)"
        >
          <i :class="configAcao(acao).icone" aria-hidden="true" />
          {{ configAcao(acao).label }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.botoes-campanha {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.campanha-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.campanha-nome {
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.campanha-versao {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: 12px;
  white-space: nowrap;
}

.campanha-acoes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.btn--salvar {
  background-color: var(--color-blue);
  color: var(--color-black-bg1);
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
