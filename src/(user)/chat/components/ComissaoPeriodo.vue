<script setup lang="ts">
import { formatarData, formatarPercentualFixo, formatarTrecho } from '../formatacao'
import { rotuloCargo, rotuloMarca } from '../rotulos'
import type { ComissaoNoTrecho, HistoricoComissaoTrecho } from '../types'

// Bloco de comissão por marca, cargo e trecho de datas (A6-74, A6-75 e contrato 2.3).
defineProps<{ linhas?: ComissaoNoTrecho[] }>()

function chaveLinha(linha: ComissaoNoTrecho): string {
  return `${linha.marca}-${linha.cargo}-${linha.data_inicio}-${linha.data_fim}`
}

function celulaComTrecho(linha: ComissaoNoTrecho, pct: number): string {
  return `${formatarTrecho(linha.data_inicio, linha.data_fim)}: ${formatarPercentualFixo(pct)}`
}

function resumoHistorico(total: number): string {
  return `${total} ${total === 1 ? 'campanha' : 'campanhas'}`
}

function descricaoTipo(item: HistoricoComissaoTrecho): string {
  if (item.tipo === 'SUBSTITUICAO') {
    if (item.pct_novo !== null && item.pct_novo !== undefined) {
      return `Substituição: passa a ${formatarPercentualFixo(item.pct_novo)}`
    }
    return 'Substituição'
  }
  if (item.pct_acrescimo !== null && item.pct_acrescimo !== undefined) {
    return `Acréscimo +${formatarPercentualFixo(item.pct_acrescimo)}`
  }
  return 'Acréscimo'
}

function periodoCampanha(item: HistoricoComissaoTrecho): string {
  if (item.data_inicio === item.data_fim) return formatarData(item.data_inicio)
  return `${formatarData(item.data_inicio)} a ${formatarData(item.data_fim)}`
}
</script>

<template>
  <section v-if="linhas && linhas.length > 0" aria-label="% de comissão no período" class="comissoes">
    <h3 class="comissoes-titulo">% de comissão no período</h3>
    <div class="rolagem">
      <table class="comissoes-tabela">
        <thead>
          <tr>
            <th scope="col" class="col-marca">Marca</th>
            <th scope="col" class="col-cargo">Cargo</th>
            <th scope="col" class="col-base">% base</th>
            <th scope="col" class="col-comissao">% vigente</th>
            <th scope="col" class="col-comissao">Com esta campanha</th>
            <th scope="col" class="col-porque">Por quê</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="linha in linhas" :key="chaveLinha(linha)">
            <td class="col-marca">{{ rotuloMarca(linha.marca) }}</td>
            <td class="col-cargo">{{ rotuloCargo(linha.cargo) }}</td>
            <td class="col-base">{{ formatarPercentualFixo(linha.pct_base) }}</td>
            <td class="col-comissao" :aria-label="celulaComTrecho(linha, linha.pct_vigente)">
              <span class="celula-trecho">{{ formatarTrecho(linha.data_inicio, linha.data_fim) }}:</span>
              <span class="celula-pct">{{ formatarPercentualFixo(linha.pct_vigente) }}</span>
            </td>
            <td class="col-comissao" :aria-label="celulaComTrecho(linha, linha.pct_com_campanha)">
              <span class="celula-trecho">{{ formatarTrecho(linha.data_inicio, linha.data_fim) }}:</span>
              <span class="celula-pct">{{ formatarPercentualFixo(linha.pct_com_campanha) }}</span>
            </td>
            <td class="col-porque">
              <details v-if="linha.historico.length">
                <summary>{{ resumoHistorico(linha.historico.length) }}</summary>
                <article
                  v-for="(item, idx) in linha.historico"
                  :key="`${item.campanha_id ?? item.nome}-${idx}`"
                  class="historico-item"
                >
                  <h4 class="historico-nome">{{ item.nome }}</h4>
                  <p class="historico-efeito">{{ descricaoTipo(item) }}</p>
                  <p class="historico-periodo">{{ periodoCampanha(item) }}</p>
                  <p v-if="item.autor && item.aprovador && item.aprovada_em" class="historico-aprovacao">
                    Sugerida por {{ item.autor }}, aprovada por {{ item.aprovador }} em {{ formatarData(item.aprovada_em) }}
                  </p>
                  <p v-if="item.justificativa" class="historico-justificativa">{{ item.justificativa }}</p>
                </article>
              </details>
              <span v-else>Nenhuma</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.comissoes {
  margin-top: 16px;
  font-family: var(--font-raleway);
  font-size: 13px;
}

.comissoes-titulo {
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-white-txt1);
}

.rolagem {
  overflow-x: auto;
  max-width: 100%;
}

.comissoes-tabela {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 8px;
  text-align: left;
  vertical-align: top;
  word-break: normal;
  overflow-wrap: normal;
}

/* Cabeçalho sem fundo próprio, marcado apenas com a borda de baixo (Leo, 28/10) */
th {
  border: none;
  border-bottom: 1px solid var(--color-gray-txt3-dark);
  color: var(--color-white-txt1);
  font-weight: 600;
  font-size: 12px;
}

td {
  border: 1px solid var(--color-gray-txt3-dark);
  color: var(--color-white-txt1);
  font-size: 13px;
}

.col-marca {
  white-space: nowrap;
}

.col-cargo {
  white-space: nowrap;
}

.col-base {
  white-space: nowrap;
}

.col-porque {
  white-space: nowrap;
}

.col-porque .historico-item {
  white-space: normal;
}

.celula-trecho,
.celula-pct {
  display: block;
  white-space: nowrap;
}

summary {
  cursor: pointer;
  color: var(--color-blue);
  font-weight: 500;
}

.historico-item {
  padding-top: 8px;
  font-size: 12px;
  line-height: 1.4;
}

.historico-item + .historico-item {
  margin-top: 6px;
  border-top: 1px dashed rgb(255 255 255 / 10%);
}

.historico-nome {
  font-weight: 600;
  color: var(--color-white-txt1);
}

.historico-efeito,
.historico-periodo,
.historico-aprovacao,
.historico-justificativa {
  color: var(--color-gray-txt2-dark);
  margin-top: 2px;
}
</style>
