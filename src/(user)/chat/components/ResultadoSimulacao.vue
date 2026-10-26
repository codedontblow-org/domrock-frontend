<script setup lang="ts">
import { computed } from 'vue'
import { formatarMoeda, renderizarMarkdown } from '../formatacao'
import {
  medidorDaMeta, medidorDoOrcamento, notaDoRetorno, numerosDaComissao, numerosDaMeta, numerosDoRetorno, pctDaMeta,
  seloDaMeta, seloDoOrcamento, textoDiferencaMeta, vereditoDoOrcamento, type SeloResultado,
} from '../resultado'
import type { CenarioAlternativo, ResultadoSimulacao } from '../types'
import BlocoResultado from './BlocoResultado.vue'
import CenariosAlternativos from './CenariosAlternativos.vue'
import DetalhamentoCusto from './DetalhamentoCusto.vue'
import MedidorResultado from './MedidorResultado.vue'
import NumerosResultado from './NumerosResultado.vue'
import SecaoExpansivel from './SecaoExpansivel.vue'

// Ordem fixa do A6-72 (ADR-004): Meta → Comissão → Retorno → Orçamento, este só com orçamento na ficha.
const props = defineProps<{ resultado: ResultadoSimulacao }>()
const emit = defineEmits<{ 'aplicar-cenario': [cenario: CenarioAlternativo] }>()

const SELO_PROVISORIO: SeloResultado = { texto: 'provisório', tom: 'neutro' }

const meta = computed(() => props.resultado.meta)
const orcamento = computed(() => props.resultado.orcamento)
const retorno = computed(() => props.resultado.retorno)
// O maior % que cabe fica no bloco Orçamento; "Sem a marca X" continua no fim, com os outros cenários.
const cenariosDoOrcamento = computed(() => props.resultado.cenarios.filter((c) => c.tipo === 'ajustar_acrescimo'))
const outrosCenarios = computed(() => props.resultado.cenarios.filter((c) => c.tipo !== 'ajustar_acrescimo'))
const explicacao = computed(() => renderizarMarkdown(props.resultado.explicacao))

function aplicar(cenario: CenarioAlternativo): void {
  emit('aplicar-cenario', cenario)
}
</script>

<template>
  <article class="resultado" aria-label="Resultado da simulação">
    <h2 class="resultado-titulo">Resultado da simulação</h2>

    <BlocoResultado titulo="Meta" :selo="seloDaMeta(meta)" :destaque="pctDaMeta(meta)" legenda="da meta">
      <MedidorResultado :medidor="medidorDaMeta(meta)"
        :descricao="`${pctDaMeta(meta)} da meta, ${textoDiferencaMeta(meta)}`" />
      <p class="resultado-linha" :class="meta.atingida ? 'tom--positivo' : 'tom--aviso'">
        {{ textoDiferencaMeta(meta) }}
      </p>
      <NumerosResultado :itens="numerosDaMeta(meta)" />
    </BlocoResultado>

    <BlocoResultado titulo="Comissão" :destaque="formatarMoeda(resultado.totais.diferenca)" legenda="de custo adicional">
      <NumerosResultado :itens="numerosDaComissao(resultado.totais, resultado.impacto)" />
      <SecaoExpansivel titulo="Onde o custo pesa">
        <DetalhamentoCusto :resultado="resultado" />
      </SecaoExpansivel>
    </BlocoResultado>

    <BlocoResultado v-if="retorno" titulo="Retorno" :selo="SELO_PROVISORIO">
      <NumerosResultado :itens="numerosDoRetorno(retorno)" />
      <p v-if="notaDoRetorno(retorno)" class="resultado-linha">{{ notaDoRetorno(retorno) }}</p>
      <p class="resultado-nota">Conta provisória, até a Dom Rock definir como medir o retorno.</p>
    </BlocoResultado>

    <BlocoResultado v-if="orcamento" titulo="Orçamento" :selo="seloDoOrcamento(orcamento)">
      <MedidorResultado :medidor="medidorDoOrcamento(orcamento)" :descricao="vereditoDoOrcamento(orcamento)" />
      <p class="resultado-linha" :class="orcamento.cabe_no_orcamento ? 'tom--positivo' : 'tom--negativo'">
        {{ vereditoDoOrcamento(orcamento) }}
      </p>
      <CenariosAlternativos :cenarios="cenariosDoOrcamento" @aplicar="aplicar" />
    </BlocoResultado>

    <div class="resultado-fim">
      <div class="resultado-explicacao" v-html="explicacao" />

      <CenariosAlternativos titulo="Outros cenários, já simulados" :cenarios="outrosCenarios" @aplicar="aplicar" />

      <SecaoExpansivel titulo="Como foi calculado">
        <p v-if="resultado.observacao" class="secao-texto">{{ resultado.observacao }}</p>
        <ul v-if="resultado.ressalvas.length" class="secao-ressalvas" aria-label="Limites da simulação">
          <li v-for="ressalva in resultado.ressalvas" :key="ressalva">{{ ressalva }}</li>
        </ul>
        <!-- Sem o código Python: nenhum perfil vê o código gerado (decisão do PO, 26/10). -->
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

.resultado-titulo {
  padding-bottom: 4px;
  font-size: 20px;
  line-height: 22px;
}

.resultado-linha {
  max-width: 68ch;
  color: var(--color-gray-txt2-dark);
  font-size: 16px;
  line-height: 1.4;
}

.resultado-nota {
  color: var(--color-gray-txt3-dark);
  font-family: var(--font-inconsolata);
  font-size: 12px;
}

.tom--positivo {
  color: var(--color-green);
}

.tom--aviso {
  color: var(--color-orange);
}

.tom--negativo {
  color: var(--color-red);
}

.resultado-fim {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.resultado-explicacao {
  max-width: 68ch;
  font-size: 15px;
  line-height: 1.6;
}

.resultado-explicacao :deep(strong) {
  font-weight: 600;
}

.secao-texto {
  max-width: 68ch;
  font-size: 14px;
  line-height: 1.5;
}

.secao-ressalvas {
  margin-top: 12px;
  padding-left: 16px;
  list-style: disc;
  color: var(--color-gray-txt3-dark);
  font-size: 12px;
  line-height: 1.5;
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
}
</style>
