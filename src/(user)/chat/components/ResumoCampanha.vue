<script setup lang="ts">
import type { ResumoCampanha } from '../types'
import { formatarMoeda, formatarPercentual } from '../formatacao'
import { formatarData } from '../resumo'
defineProps<{ campanha: ResumoCampanha; compacto?: boolean }>()
</script>
<template>
  <article class="resumo" :class="{ compacto }" aria-label="Resumo da campanha">
    <h3 :title="campanha.nome">{{ campanha.nome }}</h3>
    <div class="metadados">
      <span>De {{ formatarData(campanha.inicio) }} até {{ formatarData(campanha.fim) }}</span>
      <span>{{
        campanha.conflitos === undefined
          ? 'Conflitos não verificados'
          : campanha.conflitos.length
            ? `${campanha.conflitos.length} conflito(s)`
            : 'Sem conflitos'
      }}</span>
    </div>
    <dl>
      <div class="indicador">
        <i class="bi bi-percent" aria-hidden="true" />
        <div>
          <dt>
            Acréscimo
            <strong>{{
              campanha.acrescimo === null
                ? 'Não informado'
                : `${campanha.acrescimo > 0 ? '+' : ''}${formatarPercentual(campanha.acrescimo)}`
            }}</strong>
          </dt>
          <dd>
            {{ campanha.cargos.join(', ') || 'Cargos não informados' }} ·
            {{ campanha.marcas.join(', ') || 'Marcas não informadas' }}
          </dd>
        </div>
      </div>
      <div class="indicador">
        <i class="bi bi-cash-stack" aria-hidden="true" />
        <div>
          <dt>
            Retorno
            <strong>{{
              campanha.retorno === undefined ? 'Não informado' : formatarMoeda(campanha.retorno)
            }}</strong>
          </dt>
          <dd>
            Investimento
            {{
              campanha.investimento === undefined
                ? 'não informado'
                : formatarMoeda(campanha.investimento)
            }}
          </dd>
        </div>
      </div>
    </dl>
    <footer v-if="campanha.autor || campanha.submetidaEm">
      <span v-if="campanha.autor">Sugerido por {{ campanha.autor }}</span>
      <span v-if="campanha.submetidaEm">Submetida em {{ formatarData(campanha.submetidaEm) }}</span>
    </footer>
  </article>
</template>
<style scoped>
.resumo {
  min-width: 0;
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 4px;
  background: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
}
h3 {
  padding: 16px 16px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
}
.metadados,
footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--color-gray-txt2-dark);
  font: 12px var(--font-inconsolata);
}
.metadados {
  padding: 4px 16px;
  flex-wrap: wrap;
}
dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 16px;
}
.indicador {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}
.indicador i {
  font-size: 26px;
  color: var(--color-gray-txt2-dark);
}
dt {
  font-size: 13px;
}
strong {
  color: var(--color-blue);
}
dd {
  font: 11px var(--font-inconsolata);
  color: var(--color-gray-txt2-dark);
  overflow-wrap: anywhere;
}
footer {
  padding: 10px 16px;
  border-top: 1px solid var(--color-gray-txt3-dark);
  flex-wrap: wrap;
}
.compacto {
  max-width: 250px;
}
.compacto h3 {
  white-space: normal;
}
.compacto dl {
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (max-width: 520px) {
  dl {
    grid-template-columns: 1fr;
  }
}
</style>
