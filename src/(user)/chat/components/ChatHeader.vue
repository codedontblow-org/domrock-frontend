<script setup lang="ts">
import { computed } from 'vue'
import EtiquetaStatus from '../../campanhas/components/EtiquetaStatus.vue'
import { ETAPAS_DE_ENVIO, type CampanhaSalva, type EtapaAprovacao } from '../types'

// Barra do topo do chat (chat-bar, nós 427:694 e 427:713; Leo, 28/10).
// Altura fixa de 82px com borda inferior de 2px contínua entre a sidebar e o painel.
const props = withDefaults(
  defineProps<{
    campanha?: CampanhaSalva | null
    nome?: string
    data: string
    etapaAprovacao: EtapaAprovacao
    ocupado?: boolean
    painelAberto: boolean
    temRegra?: boolean
  }>(),
  {
    campanha: null,
    nome: undefined,
    ocupado: false,
    temRegra: false,
  },
)

const emit = defineEmits<{
  compartilhar: []
  parametros: []
}>()

const nomeExibicao = computed<string>(() => props.campanha?.nome || props.nome || 'Nova campanha')

// Data formatada entre colchetes em Inconsolata Light 12px (protótipo 427:713).
const dataFormatada = computed<string>(() => {
  if (!props.data) return ''
  return props.data.startsWith('[') ? props.data : `[${props.data}]`
})

const podeCompartilhar = computed<boolean>(() =>
  ETAPAS_DE_ENVIO.includes(props.etapaAprovacao) && !props.ocupado,
)

const motivoDesabilitado = computed<string | undefined>(() => {
  if (props.etapaAprovacao === 'sem_simulacao') {
    return 'Simule a campanha para compartilhar.'
  }
  if (props.etapaAprovacao === 'desatualizada') {
    return 'A campanha mudou depois da simulação: simule de novo para compartilhar.'
  }
  return undefined
})

const mostrarBotao = computed<boolean>(() =>
  props.etapaAprovacao !== 'somente_leitura' && props.etapaAprovacao !== 'enviada',
)
</script>

<template>
  <header class="chat-header">
    <div class="chat-header-info">
      <div class="chat-header-linha">
        <h1 class="chat-header-nome" :title="nomeExibicao">{{ nomeExibicao }}</h1>
        <template v-if="campanha">
          <EtiquetaStatus :status="campanha.status" />
          <span v-if="campanha.versao_atual !== null" class="chat-header-versao">v{{ campanha.versao_atual }}</span>
        </template>
      </div>
      <p class="chat-header-data">{{ dataFormatada }}</p>
    </div>

    <div class="chat-header-acoes">
      <!-- Botão de parâmetros (IconButton, 427:713): 40x40, sem fundo, ícone bi-sliders 20px -->
      <button
        type="button"
        class="chat-header-btn chat-header-btn--sliders"
        aria-label="Parâmetros da simulação"
        :aria-expanded="painelAberto"
        aria-controls="tab-simulacao"
        :disabled="!temRegra"
        @click="emit('parametros')"
      >
        <i class="bi bi-sliders" aria-hidden="true" />
      </button>

      <!-- Botão Compartilhar Campanha (TextButton, 427:713): fundo Background2, ícone bi-share-fill 20px -->
      <button
        v-if="mostrarBotao"
        type="button"
        class="chat-header-btn chat-header-btn--compartilhar"
        :disabled="!podeCompartilhar"
        :title="!podeCompartilhar ? motivoDesabilitado : undefined"
        @click="emit('compartilhar')"
      >
        <i class="bi bi-share-fill" aria-hidden="true" />
        Compartilhar Campanha
      </button>
    </div>
  </header>
</template>

<style scoped>
/* Barra do topo (chat-bar, nó 427:713): 82px, encosta na sidebar e no painel */
.chat-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 82px;
  box-sizing: border-box;
  padding: 20px;
  gap: 10px;
  background-color: var(--color-black-bg1);
  border-bottom: 2px solid var(--color-black-bg2);
  width: 100%;
}

.chat-header-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  justify-content: center;
}

.chat-header-linha {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* Título: Inconsolata Bold 20px, line-height 22px, Texto1, reticências quando não couber */
.chat-header-nome {
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: 20px;
  font-weight: 700;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}

.chat-header-versao {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-inconsolata);
  font-size: 12px;
  white-space: nowrap;
}

/* Data: Inconsolata Light 12px, Texto3 (#747981) */
.chat-header-data {
  color: var(--color-gray-txt3-dark);
  font-family: var(--font-inconsolata);
  font-weight: 300;
  font-size: 12px;
  line-height: 12px;
  margin: 0;
}

.chat-header-acoes {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.chat-header-btn {
  border: none;
  cursor: pointer;
  transition: opacity 0.15s, background-color 0.15s;
}

.chat-header-btn:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}

/* Botão de parâmetros (IconButton, 427:713): 40x40, border-radius 100px, sem fundo, ícone 20px */
.chat-header-btn--sliders {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 100px;
  background: transparent;
  color: var(--color-white-txt1);
  font-size: 20px;
  padding: 0;
}

.chat-header-btn--sliders:hover:not(:disabled) {
  background-color: rgb(255 255 255 / 8%);
}

.chat-header-btn--sliders:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Botão Compartilhar Campanha (TextButton, 427:713): fundo Background2, border-radius 5px, padding 10px 15px, gap 5px */
.chat-header-btn--compartilhar {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 10px 15px;
  border-radius: 5px;
  background-color: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
}

.chat-header-btn--compartilhar i {
  font-size: 20px;
}

.chat-header-btn--compartilhar:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-black-bg2) 80%, white);
}

.chat-header-btn--compartilhar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
