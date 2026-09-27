<script setup lang="ts">
import { computed } from 'vue'
import { formatarMoeda, formatarPercentual, renderizarMarkdown } from '../formatacao'
import type { CenarioAlternativo, ResultadoSimulacao } from '../types'
import CenariosAlternativos from './CenariosAlternativos.vue'
import DetalhamentoCusto from './DetalhamentoCusto.vue'
import SecaoExpansivel from './SecaoExpansivel.vue'

const props = defineProps<{ resultado: ResultadoSimulacao }>()
const emit = defineEmits<{ 'aplicar-cenario': [cenario: CenarioAlternativo] }>()

const orcamento = computed(() => props.resultado.orcamento)
const cabe = computed(() => orcamento.value.cabe_no_orcamento)
// Barra do orçamento: até 100% enche; acima disso fica cheia e muda de cor.
const consumo = computed(() => {
  const { custo_incremental: custo, orcamento_limite: limite } = orcamento.value
  return limite > 0 ? custo / limite : 1
})
const larguraBarra = computed(() => `${Math.min(consumo.value, 1) * 100}%`)
const vereditoOrcamento = computed(() =>
  cabe.value
    ? `Usa ${formatarPercentual(consumo.value * 100)} do orçamento de ${formatarMoeda(orcamento.value.orcamento_limite)}. Sobram ${formatarMoeda(orcamento.value.folga)}.`
    : `Passa ${formatarMoeda(-orcamento.value.folga)} do orçamento de ${formatarMoeda(orcamento.value.orcamento_limite)}.`,
)
const impacto = computed(() => props.resultado.impacto)
// Histórico, não previsão: "120% da meta" é 20% acima dela, e não "superou em 120%".
const comparacaoMeta = computed(() => {
  const pct = props.resultado.meta.pct_atingimento
  return pct >= 100 ? `${formatarPercentual(pct - 100)} acima da meta` : `${formatarPercentual(100 - pct)} abaixo da meta`
})
const explicacao = computed(() => renderizarMarkdown(props.resultado.explicacao))
</script>

<template>
  <article class="resultado" aria-label="Resultado da simulação">
    <header class="resultado-topo">
      <p class="resultado-rotulo">Custo extra da campanha</p>
      <span class="resultado-selo" :class="cabe ? 'selo--cabe' : 'selo--passa'">
        {{ cabe ? 'Cabe no orçamento' : 'Passa do orçamento' }}
      </span>
    </header>
    <p class="resultado-custo">{{ formatarMoeda(resultado.totais.diferenca) }}</p>

    <div class="medidor" :class="{ 'medidor--estourou': !cabe }" role="img" :aria-label="vereditoOrcamento">
      <div class="medidor-preenchido" :style="{ width: larguraBarra }" />
    </div>
    <p class="resultado-veredito" :class="cabe ? 'positivo' : 'negativo'">{{ vereditoOrcamento }}</p>

    <dl class="resultado-numeros">
      <div>
        <dt>Sem a campanha</dt>
        <dd>{{ formatarMoeda(resultado.totais.baseline) }}</dd>
      </div>
      <div>
        <dt>Com a campanha</dt>
        <dd>{{ formatarMoeda(resultado.totais.simulado) }}</dd>
        <dd class="resultado-apoio">+{{ formatarPercentual(resultado.totais.diferenca_pct) }} na comissão</dd>
      </div>
      <div>
        <dt>Recebem o acréscimo</dt>
        <dd>{{ impacto.pessoas_impactadas }} de {{ impacto.pessoas_total }} pessoas</dd>
        <dd v-if="impacto.pessoas_impactadas" class="resultado-apoio"
          :title="`Maior acréscimo individual: ${formatarMoeda(impacto.maior_acrescimo)}`">
          média de {{ formatarMoeda(impacto.media_por_pessoa) }} cada
        </dd>
      </div>
    </dl>

    <div class="resultado-explicacao" v-html="explicacao" />

    <CenariosAlternativos :cenarios="resultado.cenarios" @aplicar="emit('aplicar-cenario', $event)" />

    <div class="resultado-secoes">
      <SecaoExpansivel titulo="Onde o custo pesa">
        <DetalhamentoCusto :resultado="resultado" />
      </SecaoExpansivel>

      <SecaoExpansivel titulo="Como foi calculado">
        <p class="secao-texto">
          No histórico, as vendas do período somaram {{ formatarMoeda(resultado.meta.vendas_periodo) }},
          {{ formatarPercentual(resultado.meta.pct_atingimento) }} da meta ({{ comparacaoMeta }}).
        </p>
        <p v-if="resultado.observacao" class="secao-texto">{{ resultado.observacao }}</p>
        <ul v-if="resultado.ressalvas.length" class="secao-ressalvas" aria-label="Limites da simulação">
          <li v-for="ressalva in resultado.ressalvas" :key="ressalva">{{ ressalva }}</li>
        </ul>
        <SecaoExpansivel class="secao-codigo" titulo="Código Python que calculou a regra" discreta>
          <pre><code>{{ resultado.codigo }}</code></pre>
        </SecaoExpansivel>
        <p class="secao-rodape">
          Competências {{ resultado.competencias.join(', ') }}.
          Código {{ resultado.origem_codigo === 'llm' ? 'gerado pela Lana' : 'do modelo fixo' }}
          em {{ resultado.tentativas }} {{ resultado.tentativas === 1 ? 'tentativa' : 'tentativas' }}.
        </p>
      </SecaoExpansivel>
    </div>
  </article>
</template>

<style scoped>
.resultado {
  align-self: stretch;
  padding: 24px 24px 12px;
  border: 1px solid rgb(255 255 255 / 6%);
  border-radius: 10px;
  background-color: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
}

.resultado-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.resultado-rotulo {
  color: var(--color-gray-txt2-dark);
  font-size: 14px;
}

.resultado-selo {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.selo--cabe {
  background-color: color-mix(in srgb, var(--color-green) 14%, transparent);
  color: var(--color-green);
}

.selo--passa {
  background-color: color-mix(in srgb, var(--color-red) 14%, transparent);
  color: var(--color-red);
}

.resultado-custo {
  margin-top: 6px;
  font-family: var(--font-forum);
  font-size: 56px;
  line-height: 1;
}

.medidor {
  height: 8px;
  margin-top: 16px;
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
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.resultado-numeros dt {
  color: var(--color-gray-txt2-dark);
  font-size: 13px;
}

.resultado-numeros dd {
  margin-top: 4px;
  font-size: 17px;
  font-weight: 500;
}

.resultado-numeros .resultado-apoio {
  margin-top: 2px;
  color: var(--color-gray-txt2-dark);
  font-size: 13px;
  font-weight: 400;
}

.resultado-explicacao {
  max-width: 68ch;
  margin-top: 20px;
  font-size: 15px;
  line-height: 1.6;
}

.resultado-explicacao :deep(strong) {
  font-weight: 600;
}

.resultado-secoes {
  margin-top: 16px;
}

.secao-texto {
  max-width: 68ch;
  font-size: 14px;
  line-height: 1.5;
}

.secao-texto + .secao-texto {
  margin-top: 6px;
  color: var(--color-gray-txt2-dark);
}

.secao-ressalvas {
  margin-top: 12px;
  padding-left: 16px;
  list-style: disc;
  color: var(--color-gray-txt3-dark);
  font-size: 12px;
  line-height: 1.5;
}

.secao-codigo {
  margin-top: 12px;
}

.secao-codigo pre {
  max-height: 360px;
  margin-top: 6px;
  padding: 12px;
  border-radius: 6px;
  background-color: var(--color-black-bg1);
  overflow: auto;
  font-family: var(--font-inconsolata);
  font-size: 13px;
  line-height: 1.4;
}

.secao-rodape {
  margin-top: 10px;
  color: var(--color-gray-txt3-dark);
  font-size: 12px;
}

@media (max-width: 560px) {
  .resultado {
    padding: 18px 16px 8px;
  }

  .resultado-custo {
    font-size: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .medidor-preenchido {
    transition: none;
  }
}
</style>
