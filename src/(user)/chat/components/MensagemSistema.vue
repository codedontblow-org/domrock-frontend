<script setup lang="ts">
import { formatarDataHoraCurta } from '../formatacao'
import type { CenarioAlternativo, MensagemChat } from '../types'
import ResultadoSimulacao from './ResultadoSimulacao.vue'

const props = defineProps<{
  mensagem: MensagemChat
  carregando?: boolean
}>()

const emit = defineEmits<{
  verResultado: [simulacaoId: number]
  aplicarCenario: [cenario: CenarioAlternativo]
}>()

function aoClicarVerResultado(): void {
  if (!props.mensagem.simulacao_id || props.carregando) return
  emit('verResultado', props.mensagem.simulacao_id)
}
</script>

<template>
  <div class="linha-sistema" role="status">
    <span class="sistema-linha" aria-hidden="true" />
    <div class="sistema-conteudo">
      <span class="sistema-texto">
        {{ mensagem.texto }}
        <time v-if="mensagem.criada_em" class="sistema-data">
          · {{ formatarDataHoraCurta(mensagem.criada_em) }}
        </time>
      </span>
      <button
        v-if="mensagem.tipo === 'SIMULACAO' && !mensagem.resultado && mensagem.simulacao_id"
        type="button"
        class="botao-ver-resultado"
        :disabled="carregando"
        @click="aoClicarVerResultado"
      >
        {{ carregando ? 'Carregando…' : 'Ver resultado' }}
      </button>
    </div>
    <span class="sistema-linha" aria-hidden="true" />
  </div>

  <ResultadoSimulacao
    v-if="mensagem.resultado"
    :resultado="mensagem.resultado"
    @aplicar-cenario="emit('aplicarCenario', $event)"
  />
</template>

<style scoped>
.linha-sistema {
  align-self: stretch;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.sistema-linha {
  flex: 1;
  height: 1px;
  background-color: rgb(255 255 255 / 10%);
}

.sistema-conteudo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.sistema-texto {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  text-align: center;
}

.sistema-data {
  color: var(--color-gray-txt3-dark);
  font-size: 12px;
  margin-left: 4px;
}

.botao-ver-resultado {
  background: transparent;
  color: var(--color-blue);
  border: 1px solid color-mix(in srgb, var(--color-blue) 40%, transparent);
  border-radius: 6px;
  padding: 3px 10px;
  font-family: var(--font-raleway);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.botao-ver-resultado:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-blue) 15%, transparent);
  border-color: var(--color-blue);
}

.botao-ver-resultado:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
