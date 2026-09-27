<script setup lang="ts">
import { formatarMoeda, formatarPercentual } from '../formatacao'
import type { CenarioAlternativo } from '../types'

defineProps<{ cenarios: CenarioAlternativo[] }>()
const emit = defineEmits<{ aplicar: [cenario: CenarioAlternativo] }>()

function efeito(cenario: CenarioAlternativo): string {
  if (cenario.economia > 0) return `${formatarMoeda(cenario.economia)} a menos`
  if (cenario.economia < 0) return `${formatarMoeda(-cenario.economia)} a mais`
  return 'mesmo custo'
}
</script>

<template>
  <section v-if="cenarios.length" class="cenarios" aria-labelledby="cenarios-titulo">
    <h3 id="cenarios-titulo" class="cenarios-titulo">Outros cenários, já simulados</h3>
    <ul class="cenarios-lista">
      <li v-for="cenario in cenarios" :key="cenario.tipo" class="cenario">
        <div class="cenario-texto">
          <p class="cenario-nome">{{ cenario.titulo }}</p>
          <p class="cenario-detalhe">
            Acréscimo de {{ formatarPercentual(cenario.pct_acrescimo) }}, {{ efeito(cenario) }}
          </p>
        </div>
        <div class="cenario-custo">
          <span class="cenario-valor">{{ formatarMoeda(cenario.custo_incremental) }}</span>
          <span class="cenario-situacao" :class="cenario.cabe_no_orcamento ? 'positivo' : 'negativo'">
            {{ cenario.cabe_no_orcamento ? 'Cabe' : 'Não cabe' }}
          </span>
        </div>
        <button type="button" class="cenario-aplicar" :title="`Preencher o painel com: ${cenario.titulo}`"
          @click="emit('aplicar', cenario)">
          Usar no painel
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.cenarios {
  margin-top: 24px;
}

.cenarios-titulo {
  color: var(--color-gray-txt2-dark);
  font-size: 13px;
  font-weight: 500;
}

.cenarios-lista {
  margin-top: 8px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 8px;
}

.cenario {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 16px;
  align-items: center;
  padding: 12px 14px;
}

.cenario + .cenario {
  border-top: 1px solid rgb(255 255 255 / 8%);
}

.cenario-nome {
  font-size: 14px;
  font-weight: 600;
}

.cenario-detalhe {
  margin-top: 2px;
  color: var(--color-gray-txt2-dark);
  font-size: 13px;
}

.cenario-custo {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.cenario-valor {
  font-size: 15px;
  font-weight: 500;
}

.cenario-situacao {
  font-size: 12px;
}

.positivo {
  color: var(--color-green);
}

.negativo {
  color: var(--color-red);
}

.cenario-aplicar {
  padding: 7px 12px;
  border: 1px solid rgb(0 180 241 / 50%);
  border-radius: 6px;
  background: transparent;
  color: var(--color-blue);
  font-family: var(--font-raleway);
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s;
}

.cenario-aplicar:hover {
  background-color: rgb(0 180 241 / 12%);
}

.cenario-aplicar:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}

@media (max-width: 560px) {
  .cenario {
    grid-template-columns: 1fr auto;
  }

  .cenario-aplicar {
    grid-column: 1 / -1;
    justify-self: start;
  }
}
</style>
