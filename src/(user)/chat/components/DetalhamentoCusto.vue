<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatarMoeda } from '../formatacao'
import { NOMES_CARGO, NOMES_MARCA } from '../rotulos'
import type { QuebraDimensao, ResultadoSimulacao } from '../types'

const props = defineProps<{ resultado: ResultadoSimulacao }>()

type Dimensao = 'marca' | 'cargo' | 'loja'

const afetadas = (linhas: QuebraDimensao[]) =>
  linhas.filter((l) => l.diferenca > 0).sort((a, b) => b.diferenca - a.diferenca)

const ABAS: { id: Dimensao; rotulo: string }[] = [
  { id: 'marca', rotulo: 'Marca' },
  { id: 'cargo', rotulo: 'Cargo' },
  { id: 'loja', rotulo: 'Lojas' },
]
const aba = ref<Dimensao>('marca')

const linhasPorAba = computed<Record<Dimensao, QuebraDimensao[]>>(() => ({
  marca: afetadas(props.resultado.por_marca),
  cargo: afetadas(props.resultado.por_cargo),
  loja: props.resultado.maiores_lojas,
}))

function nomear(dimensao: Dimensao, codigo: string): string {
  if (dimensao === 'marca') return NOMES_MARCA[codigo] ?? codigo
  if (dimensao === 'cargo') return NOMES_CARGO[codigo] ?? codigo
  return `Loja ${codigo}`
}

// A barra mostra a fatia do custo extra total, não a relação com a maior linha.
function fatia(linha: QuebraDimensao): number {
  const total = props.resultado.totais.diferenca
  return total > 0 ? linha.diferenca / total : 0
}

const linhas = computed(() => linhasPorAba.value[aba.value])
</script>

<template>
  <div class="detalhe">
    <div class="detalhe-abas" role="tablist" aria-label="Ver o custo extra por">
      <button v-for="item in ABAS" :key="item.id" type="button" role="tab" class="detalhe-aba"
        :class="{ 'detalhe-aba--ativa': aba === item.id }" :aria-selected="aba === item.id"
        :disabled="!linhasPorAba[item.id].length" @click="aba = item.id">
        {{ item.rotulo }}
      </button>
    </div>

    <p v-if="aba === 'loja'" class="detalhe-nota">As 5 lojas onde o custo extra mais pesa.</p>

    <ul class="detalhe-linhas" role="tabpanel">
      <li v-for="linha in linhas" :key="linha.codigo" class="detalhe-linha">
        <span class="detalhe-nome">{{ nomear(aba, linha.codigo) }}</span>
        <span class="detalhe-valor">{{ formatarMoeda(linha.diferenca) }}</span>
        <span class="detalhe-pct">{{ Math.round(fatia(linha) * 100) }}%</span>
        <span class="detalhe-trilho" aria-hidden="true">
          <span class="detalhe-barra" :style="{ width: `${Math.max(fatia(linha) * 100, 1)}%` }" />
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.detalhe-abas {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 8px;
  background-color: rgb(255 255 255 / 5%);
}

.detalhe-aba {
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  cursor: pointer;
}

.detalhe-aba:hover:not(:disabled) {
  color: var(--color-white-txt1);
}

.detalhe-aba--ativa {
  background-color: var(--color-black-bg1);
  color: var(--color-white-txt1);
}

.detalhe-aba:disabled {
  opacity: 0.4;
  cursor: default;
}

.detalhe-aba:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 1px;
}

.detalhe-nota {
  margin-top: 10px;
  color: var(--color-gray-txt3-dark);
  font-size: 12px;
}

.detalhe-linhas {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.detalhe-linha {
  display: grid;
  grid-template-columns: 1fr auto 44px;
  row-gap: 4px;
  align-items: baseline;
  font-size: 14px;
}

.detalhe-valor {
  font-weight: 500;
}

.detalhe-pct {
  color: var(--color-gray-txt3-dark);
  font-size: 12px;
  text-align: right;
}

.detalhe-trilho {
  grid-column: 1 / -1;
  height: 4px;
  border-radius: 999px;
  background-color: rgb(255 255 255 / 6%);
}

.detalhe-barra {
  display: block;
  height: 100%;
  border-radius: inherit;
  background-color: var(--color-blue);
}
</style>
