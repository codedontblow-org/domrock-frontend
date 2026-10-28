<script setup lang="ts">
import { formatarData, formatarMoeda, formatarPercentual } from '../formatacao'
import type { ConferenciaCampanha } from '../conferencia'
import ComissaoPeriodo from './ComissaoPeriodo.vue'

// Resumo dos dados da campanha para conferência no modal de compartilhamento (protótipo 388:760).
defineProps<{
  conferencia: ConferenciaCampanha
}>()
</script>

<template>
  <div class="conferencia">
    <dl class="conferencia-grade">
      <div class="conferencia-item">
        <dt>Período</dt>
        <dd v-if="conferencia.inicio && conferencia.fim">
          {{ formatarData(conferencia.inicio) }} a {{ formatarData(conferencia.fim) }}
        </dd>
        <dd v-else>Não informado</dd>
      </div>

      <div class="conferencia-item">
        <dt>Acréscimo</dt>
        <dd v-if="conferencia.acrescimo !== null">
          +{{ formatarPercentual(conferencia.acrescimo) }}
        </dd>
        <dd v-else>Não informado</dd>
      </div>

      <div class="conferencia-item">
        <dt>Marcas</dt>
        <dd>{{ conferencia.marcas.length ? conferencia.marcas.join(', ') : 'Todas' }}</dd>
      </div>

      <div class="conferencia-item">
        <dt>Cargos</dt>
        <dd>{{ conferencia.cargos.length ? conferencia.cargos.join(', ') : 'Todos' }}</dd>
      </div>

      <div
        v-if="conferencia.custoIncremental !== null && conferencia.custoIncremental !== undefined"
        class="conferencia-item"
      >
        <dt>Custo incremental</dt>
        <dd>{{ formatarMoeda(conferencia.custoIncremental) }}</dd>
      </div>
    </dl>

    <ComissaoPeriodo
      v-if="conferencia.comissaoPeriodo?.length"
      :linhas="conferencia.comissaoPeriodo"
    />
  </div>
</template>

<style scoped>
.conferencia {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
  font-family: var(--font-raleway);
  font-size: 13px;
}

.conferencia-grade {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.conferencia-item dt {
  color: var(--color-gray-txt2-dark);
  font-size: 12px;
  margin-bottom: 2px;
}

.conferencia-item dd {
  color: var(--color-white-txt1);
  font-weight: 500;
}
</style>
