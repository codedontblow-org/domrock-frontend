<script setup lang="ts">
import type { ComissaoPeriodo } from '../types'
import { formatarPercentual } from '../formatacao'
import { formatarData } from '../resumo'
defineProps<{ linhas?: ComissaoPeriodo[] }>()
</script>
<template>
  <section aria-label="% de comissão no período" class="comissoes">
    <h3>% de comissão no período</h3>
    <p v-if="!linhas?.length">Comissão vigente ainda não informada pela Lana.</p>
    <div v-else class="rolagem">
      <table>
        <thead>
          <tr>
            <th scope="col">Marca</th>
            <th scope="col">Cargo</th>
            <th scope="col">% base</th>
            <th scope="col">% vigente</th>
            <th scope="col">Com esta campanha</th>
            <th scope="col">Por quê</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="linha in linhas" :key="linha.id">
            <td>{{ linha.marca }}</td>
            <td>{{ linha.cargo }}</td>
            <td>{{ formatarPercentual(linha.base) }}</td>
            <td>
              {{ formatarData(linha.inicio) }} a {{ formatarData(linha.fim) }}:<br />{{
                formatarPercentual(linha.vigente)
              }}
            </td>
            <td>
              {{ formatarData(linha.inicio) }} a {{ formatarData(linha.fim) }}:<br />{{
                formatarPercentual(linha.comCampanha)
              }}
            </td>
            <td>
              <details v-if="linha.historico.length">
                <summary>{{ linha.historico.length }} campanha(s)</summary>
                <article v-for="item in linha.historico" :key="item.id">
                  <h4>{{ item.nome }}</h4>
                  <p>
                    {{ formatarData(item.inicio) }} a {{ formatarData(item.fim) }} ·
                    {{ formatarPercentual(item.acrescimo) }}
                  </p>
                  <p>
                    Autor: {{ item.autor }}. Aprovador: {{ item.aprovador }} em
                    {{ formatarData(item.aprovadoEm) }}.
                  </p>
                  <p>{{ item.justificativa }}</p>
                </article>
              </details>
              <span v-else>Sem campanhas no período</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
<style scoped>
.comissoes {
  margin-top: 20px;
  font-family: var(--font-raleway);
  font-size: 13px;
}
h3 {
  margin-bottom: 10px;
  font-size: 16px;
}
p {
  color: var(--color-gray-txt2-dark);
}
.rolagem {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 620px;
}
th,
td {
  border: 1px solid var(--color-gray-txt3-dark);
  padding: 10px;
  text-align: left;
  vertical-align: top;
}
th {
  background: var(--color-black-bg2);
}
summary {
  cursor: pointer;
  color: var(--color-blue);
}
article {
  min-width: 180px;
  padding-top: 12px;
}
</style>
