<script setup lang="ts">
import { computed, ref } from 'vue'
import BotaoIcone from '@/components/BotaoIcone.vue'
import ParametroCampo from './ParametroCampo.vue'
import { ETAPAS_DE_ENVIO, type EtapaAprovacao, type RegraCampanha, type ValorParametro } from '../types'

const props = defineProps<{
  regra: RegraCampanha
  camposVazios: string[]
  podeSimular: boolean
  simulando: boolean
  aprovacao: EtapaAprovacao
  ocupado: boolean
}>()

const emit = defineEmits<{
  alterar: [key: string, valor: ValorParametro]
  simular: []
  recolher: []
  enviarAprovacao: [nome: string]
}>()

/** Limite do nome no backend (CampanhaService.NOME_MAXIMO). */
const NOME_MAXIMO = 150

const comandoAberto = ref(false)
const nomeCampanha = ref('')
const podeEnviar = computed(() =>
  ETAPAS_DE_ENVIO.includes(props.aprovacao) && !props.ocupado && nomeCampanha.value.trim().length > 0,
)
const avisoAprovacao = computed(() => {
  if (props.aprovacao === 'enviada') return 'Enviada! Acompanhe em Campanhas.'
  if (props.aprovacao === 'desatualizada') return 'A campanha mudou depois da simulação: simule de novo para enviar.'
  if (props.aprovacao === 'fora_do_orcamento') {
    return 'O custo passa do orçamento. Dá para enviar assim mesmo: o supervisor vê o estouro na análise.'
  }
  return 'O supervisor recebe a campanha com o resultado da última simulação.'
})
const regras = computed(() => props.regra.parametros.filter((p) => p.categoria === 'REGRA'))
const limites = computed(() => props.regra.parametros.filter((p) => p.categoria === 'CONSTRAINT'))
const pendentes = computed(() => props.camposVazios.length)

const status = computed(() => {
  if (pendentes.value === 0) return 'Pronta para simular'
  return pendentes.value === 1 ? '1 pendente' : `${pendentes.value} pendentes`
})

const aviso = computed(() => {
  if (props.simulando) return 'Gerando o código da regra e simulando sobre os dados reais.'
  if (pendentes.value > 0) return 'Preencha os campos em laranja para simular.'
  return 'A simulação usa exatamente os valores acima.'
})
</script>

<template>
  <section class="ficha" aria-labelledby="ficha-titulo">
    <header class="ficha-cabecalho">
      <h2 id="ficha-titulo" class="ficha-titulo">Campanha</h2>
      <span class="ficha-status" :class="pendentes ? 'ficha-status--pendente' : 'ficha-status--pronta'">
        {{ status }}
      </span>
      <BotaoIcone class="ficha-recolher" icone="bi bi-layout-sidebar-inset-reverse" dica="Recolher o painel"
        lado="baixo" @click="emit('recolher')" />
    </header>

    <button v-if="regra.raw_prompt" type="button" class="ficha-comando"
      :class="{ 'ficha-comando--aberto': comandoAberto }" :aria-expanded="comandoAberto"
      :title="comandoAberto ? 'Recolher o comando' : 'Ver o comando completo'" @click="comandoAberto = !comandoAberto">
      {{ regra.raw_prompt }}
    </button>

    <div class="ficha-corpo">
      <div class="ficha-grupo" aria-label="Regra">
        <ParametroCampo v-for="p in regras" :key="p.key" :parametro="p" @alterar="emit('alterar', p.key, $event)" />
      </div>
      <div class="ficha-grupo ficha-grupo--limites" aria-label="Limites">
        <ParametroCampo v-for="p in limites" :key="p.key" :parametro="p" @alterar="emit('alterar', p.key, $event)" />
      </div>
    </div>

    <footer class="ficha-rodape">
      <button type="button" class="ficha-simular" :disabled="!podeSimular" @click="emit('simular')">
        {{ simulando ? 'Simulando…' : 'Simular campanha' }}
      </button>
      <p class="ficha-aviso" aria-live="polite">{{ aviso }}</p>

      <!-- Depois de simular, a conversa pode virar campanha e ir para o supervisor. -->
      <form v-if="aprovacao !== 'sem_simulacao' && aprovacao !== 'somente_leitura'" class="ficha-aprovacao"
        @submit.prevent="podeEnviar && emit('enviarAprovacao', nomeCampanha)">
        <input v-if="aprovacao !== 'enviada'" v-model="nomeCampanha" class="ficha-nome" type="text"
          :maxlength="NOME_MAXIMO" placeholder="Nome da campanha (ex.: Natal 2025)" aria-label="Nome da campanha"
          :disabled="aprovacao === 'enviando'" />
        <button v-if="aprovacao !== 'enviada'" type="submit" class="ficha-enviar" :disabled="!podeEnviar">
          {{ aprovacao === 'enviando' ? 'Enviando…' : 'Enviar para aprovação' }}
        </button>
        <p class="ficha-aviso" aria-live="polite" :class="{
          'ficha-aviso--enviada': aprovacao === 'enviada',
          'ficha-aviso--alerta': aprovacao === 'fora_do_orcamento',
        }">
          {{ avisoAprovacao }}
        </p>
      </form>
    </footer>
  </section>
</template>

<style scoped>
/* Ocupa a altura da janela: os campos respiram e o botão Simular fica sempre no rodapé. */
.ficha {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 32px);
  border-radius: 8px;
  background-color: var(--color-black-bg2);
  overflow: hidden;
}

.ficha-cabecalho {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px 0 16px;
}

.ficha-titulo {
  flex: 1;
  color: var(--color-white-txt1);
  font-family: var(--font-forum);
  font-size: 26px;
  line-height: 1;
}

.ficha-status {
  font-family: var(--font-raleway);
  font-size: 12px;
  white-space: nowrap;
}

.ficha-status--pendente {
  color: var(--color-orange);
}

.ficha-status--pronta {
  color: var(--color-green);
}

/* O comando original fica em 2 linhas; um clique mostra inteiro. */
.ficha-comando {
  display: -webkit-box;
  margin: 8px 16px 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-gray-txt3-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
  font-style: italic;
  line-height: 1.45;
  text-align: left;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  cursor: pointer;
}

.ficha-comando--aberto {
  -webkit-line-clamp: unset;
  line-clamp: unset;
}

.ficha-comando:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}

.ficha-corpo {
  flex: 1;
  min-height: 0;
  margin-top: 12px;
  padding: 0 16px 14px;
  overflow-y: auto;
}

.ficha-grupo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Meta e orçamento lado a lado: são os dois limites da campanha e se leem juntos. */
.ficha-grupo--limites {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.ficha-rodape {
  padding: 12px 16px 14px;
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.ficha-simular {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background-color: var(--color-blue);
  color: var(--color-black-bg1);
  font-family: var(--font-raleway);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.ficha-simular:disabled {
  background-color: rgb(255 255 255 / 8%);
  color: var(--color-gray-txt3-dark);
  cursor: not-allowed;
}

.ficha-simular:focus-visible {
  outline: 2px solid var(--color-white-txt1);
  outline-offset: 2px;
}

.ficha-aviso {
  margin-top: 8px;
  color: var(--color-gray-txt3-dark);
  font-family: var(--font-raleway);
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
}

.ficha-aviso--enviada {
  color: var(--color-green);
}

.ficha-aviso--alerta {
  color: var(--color-orange);
}

.ficha-aprovacao {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.ficha-nome {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 6px;
  background-color: var(--color-black-bg1);
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 14px;
}

.ficha-nome:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: -1px;
}

/* Secundário ao Simular: contorno no lugar do fundo cheio. */
.ficha-enviar {
  width: 100%;
  padding: 9px;
  border: 1px solid var(--color-blue);
  border-radius: 6px;
  background: none;
  color: var(--color-blue);
  font-family: var(--font-raleway);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.ficha-enviar:disabled {
  border-color: rgb(255 255 255 / 8%);
  color: var(--color-gray-txt3-dark);
  cursor: not-allowed;
}

.ficha-enviar:focus-visible {
  outline: 2px solid var(--color-white-txt1);
  outline-offset: 2px;
}
</style>
