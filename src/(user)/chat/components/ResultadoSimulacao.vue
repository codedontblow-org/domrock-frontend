<script setup lang="ts">
import { computed } from 'vue'
import { formatarMoeda, formatarPercentual, renderizarMarkdown } from '../formatacao'
import { NOMES_CARGO, NOMES_MARCA } from '../rotulos'
import type { QuebraDimensao, ResultadoSimulacao } from '../types'

const props = defineProps<{ resultado: ResultadoSimulacao }>()

const orcamento = computed(() => props.resultado.orcamento)
// Barra do orçamento: até 100% enche; acima disso fica cheia e muda de cor.
const consumo = computed(() => {
  const { custo_incremental: custo, orcamento_limite: limite } = orcamento.value
  return limite > 0 ? custo / limite : 1
})
const larguraBarra = computed(() => `${Math.min(consumo.value, 1) * 100}%`)
const vereditoOrcamento = computed(() =>
  orcamento.value.cabe_no_orcamento
    ? `Usa ${formatarPercentual(consumo.value * 100)} do orçamento de ${formatarMoeda(orcamento.value.orcamento_limite)}. Sobram ${formatarMoeda(orcamento.value.folga)}.`
    : `Passa ${formatarMoeda(-orcamento.value.folga)} do orçamento de ${formatarMoeda(orcamento.value.orcamento_limite)}.`,
)
const afetados = (linhas: QuebraDimensao[]) => linhas.filter((l) => l.diferenca !== 0)
const marcasAfetadas = computed(() => afetados(props.resultado.por_marca))
const cargosAfetados = computed(() => afetados(props.resultado.por_cargo))
const quebras = computed(() => [
  { titulo: 'Custo extra por marca', linhas: marcasAfetadas.value, nomes: NOMES_MARCA },
  { titulo: 'Custo extra por cargo', linhas: cargosAfetados.value, nomes: NOMES_CARGO },
])
const explicacao = computed(() => renderizarMarkdown(props.resultado.explicacao))
</script>

<template>
  <article class="resultado" aria-label="Resultado da simulação">
    <p class="resultado-rotulo">Custo extra da campanha</p>
    <p class="resultado-custo">{{ formatarMoeda(resultado.totais.diferenca) }}</p>

    <div class="medidor" :class="{ 'medidor--estourou': !orcamento.cabe_no_orcamento }" role="img"
      :aria-label="vereditoOrcamento">
      <div class="medidor-preenchido" :style="{ width: larguraBarra }" />
    </div>
    <p class="resultado-veredito" :class="orcamento.cabe_no_orcamento ? 'positivo' : 'negativo'">
      {{ vereditoOrcamento }}
    </p>

    <dl class="resultado-numeros">
      <div>
        <dt>Comissão sem a campanha</dt>
        <dd>{{ formatarMoeda(resultado.totais.baseline) }}</dd>
      </div>
      <div>
        <dt>Com a campanha</dt>
        <dd>{{ formatarMoeda(resultado.totais.simulado) }} <small>+{{ formatarPercentual(resultado.totais.diferenca_pct) }}</small></dd>
      </div>
      <div>
        <dt>Vendas no período</dt>
        <dd>
          {{ formatarMoeda(resultado.meta.vendas_periodo) }}
          <small :class="resultado.meta.atingida ? 'positivo' : 'negativo'">
            {{ formatarPercentual(resultado.meta.pct_atingimento) }} da meta
          </small>
        </dd>
      </div>
    </dl>

    <div v-if="marcasAfetadas.length" class="resultado-quebras">
      <table v-for="quebra in quebras" :key="quebra.titulo" class="resultado-tabela">
        <caption>{{ quebra.titulo }}</caption>
        <tbody>
          <tr v-for="linha in quebra.linhas" :key="linha.codigo">
            <th scope="row">{{ quebra.nomes[linha.codigo] ?? linha.codigo }}</th>
            <td>{{ formatarMoeda(linha.diferenca) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="resultado-explicacao" v-html="explicacao" />
    <p v-if="resultado.observacao" class="resultado-observacao">{{ resultado.observacao }}</p>

    <details class="resultado-codigo">
      <summary>Ver o código Python que calculou a regra</summary>
      <pre><code>{{ resultado.codigo }}</code></pre>
      <p class="resultado-rodape">
        Competências {{ resultado.competencias.join(', ') }}.
        Código {{ resultado.origem_codigo === 'llm' ? 'gerado pela Lana' : 'do modelo fixo' }}
        em {{ resultado.tentativas }} {{ resultado.tentativas === 1 ? 'tentativa' : 'tentativas' }}.
      </p>
    </details>
  </article>
</template>

<style scoped>
.resultado {
  align-self: stretch;
  padding: 24px;
  border-radius: 6px;
  background-color: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
}

.resultado-rotulo {
  color: var(--color-gray-txt2-dark);
  font-size: 14px;
}

.resultado-custo {
  margin-top: 4px;
  font-family: var(--font-forum);
  font-size: 64px;
  line-height: 1;
}

.medidor {
  height: 10px;
  margin-top: 18px;
  border-radius: 999px;
  background-color: rgb(255 255 255 / 8%);
  overflow: hidden;
}

.medidor-preenchido {
  height: 100%;
  border-radius: inherit;
  background-color: var(--color-green);
  transition: width 0.8s ease-out;
}

.medidor--estourou .medidor-preenchido {
  background-color: var(--color-red);
}

.resultado-veredito {
  margin-top: 8px;
  font-size: 14px;
}

.positivo {
  color: var(--color-green);
}

.negativo {
  color: var(--color-red);
}

.resultado-numeros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.resultado-numeros dt {
  color: var(--color-gray-txt2-dark);
  font-size: 13px;
}

.resultado-numeros dd {
  margin-top: 2px;
  font-size: 18px;
}

.resultado-numeros small {
  display: block;
  font-size: 13px;
}

.resultado-quebras {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px 32px;
  margin-top: 24px;
}

.resultado-tabela {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.resultado-tabela caption {
  margin-bottom: 6px;
  color: var(--color-gray-txt2-dark);
  font-size: 13px;
  text-align: left;
}

.resultado-tabela th {
  padding: 4px 0;
  font-weight: normal;
  text-align: left;
}

.resultado-tabela td {
  font-family: var(--font-inconsolata);
  text-align: right;
}

.resultado-explicacao {
  max-width: 64ch;
  margin-top: 24px;
  font-size: 15px;
  line-height: 1.6;
}

.resultado-explicacao :deep(strong) {
  font-weight: 700;
}

.resultado-observacao {
  margin-top: 12px;
  color: var(--color-gray-txt2-dark);
  font-size: 13px;
}

.resultado-codigo {
  margin-top: 20px;
  font-size: 14px;
}

.resultado-codigo summary {
  color: var(--color-blue);
  cursor: pointer;
}

.resultado-codigo pre {
  max-height: 360px;
  margin-top: 10px;
  padding: 12px;
  border-radius: 4px;
  background-color: var(--color-black-bg1);
  overflow: auto;
  font-family: var(--font-inconsolata);
  font-size: 13px;
  line-height: 1.4;
}

.resultado-rodape {
  margin-top: 8px;
  color: var(--color-gray-txt3-dark);
  font-size: 12px;
}

@media (prefers-reduced-motion: reduce) {
  .medidor-preenchido {
    transition: none;
  }
}
</style>
