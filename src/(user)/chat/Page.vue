<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { usuarioLogado } from '@/services/auth'
import { saudacao } from './formatacao'
import Input from './components/Input.vue'
import SpeechBubble from './components/SpeechBubble.vue'
import MensagemSistema from './components/MensagemSistema.vue'
import ParametrosPanel from './components/ParametrosPanel.vue'
import ResultadoSimulacao from './components/ResultadoSimulacao.vue'
import FerramentasDropdown from './components/FerramentasDropdown.vue'
import ChatHeader from './components/ChatHeader.vue'
import CompartilharCampanhaModal from './components/CompartilharCampanhaModal.vue'
import { montarConferencia } from './conferencia'
import { useChatStore } from './stores/chat'

const chat = useChatStore()
const {
  mensagens, regra, aguardandoLana, simulando, etapaSimulacao, camposVazios, podeSimular, etapaAprovacao, ocupado,
  somenteLeitura, podeVoltarRascunho, editandoCampanha, simulacoesCarregando, campanha, dataInicio, erroEnvio, ultimoResultado,
} = storeToRefs(chat)
const rota = useRoute()

// Resumo e conflitos para conferência antes de submeter a campanha (A6-75).
const conferencia = computed(() =>
  regra.value ? montarConferencia(regra.value, ultimoResultado.value) : null,
)

const campanhaNaQuery = computed(() => {
  const c = rota.query.campanha
  return c ? String(c) : null
})

watch(
  campanhaNaQuery,
  async (nova, antiga) => {
    if (nova) {
      const id = Number(nova)
      if (Number.isInteger(id)) await chat.abrirCampanha(id)
    } else if (antiga || chat.abertaPelaCampanha) {
      chat.novaConversa()
    } else {
      await chat.restaurarSessaoSeVazio()
    }
  },
  { immediate: true },
)

const modalCompartilharAberto = ref(false)

function abrirCompartilhar(): void {
  modalCompartilharAberto.value = true
}

watch(() => somenteLeitura.value, (leitura) => {
  if (leitura) modalCompartilharAberto.value = false
})

const fimDaConversa = ref<HTMLElement | null>(null)
// Saudação com o primeiro nome de quem está logado (salvo no login).
const primeiroNome = (JSON.parse(localStorage.getItem('usuario') ?? 'null')?.nome ?? '').trim().split(/\s+/)[0]

// Painel de simulação (tab-simulacao, nó 641:1860; Leo, 28/10).
// Abre sozinho na primeira vez que a regra aparece; depois disso vale a escolha da pessoa.
const painelAberto = ref(false)
const jaAbriuPelaRegra = ref(false)

watch(regra, (novaRegra) => {
  if (novaRegra && !jaAbriuPelaRegra.value) {
    painelAberto.value = true
    jaAbriuPelaRegra.value = true
  } else if (!novaRegra) {
    painelAberto.value = false
    jaAbriuPelaRegra.value = false
  }
}, { immediate: true })

// Depois da primeira troca, o convite inicial some: a conversa já diz o que fazer.
const placeholderDoCampo = computed<string>(() => {
  if (somenteLeitura.value) return 'Conversa aberta só para consulta'
  return mensagens.value.length === 0 ? 'Descreva sua campanha para a Lana' : 'Responder à Lana'
})
const textoSaudacao = saudacao(usuarioLogado()?.nome)

// Mantém a última mensagem (ou o resultado) visível quando algo novo chega.
watch(() => mensagens.value.length, async () => {
  await nextTick()
  fimDaConversa.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
})
</script>

<template>
  <div
    class="chat-page"
    :class="{ 'empty-state': mensagens.length === 0 }"
  >
    <!-- Estado vazio (sem mensagens, boas-vindas): continua como está hoje, sem barra e sem painel (427:694) -->
    <div v-if="mensagens.length === 0" class="conversa-vazia">
      <div class="welcome">
        <h1>{{ primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!' }}</h1>
        <p>O que você tem em mente hoje?</p>
      </div>

      <div class="chat-input chat-input--empty">
        <Input :ocupado="ocupado" :placeholder="placeholderDoCampo" @send="chat.enviar" />
      </div>
    </div>

    <!-- Coluna da conversa com mensagens: ocupa toda a largura entre a sidebar e o painel -->
    <div v-else class="conversa">
      <!-- Barra do topo (chat-bar, nó 427:713): encosta na sidebar e no painel -->
      <ChatHeader
        :campanha="campanha"
        :data="dataInicio"
        :etapa-aprovacao="etapaAprovacao"
        :ocupado="ocupado"
        :painel-aberto="painelAberto"
        :tem-regra="!!regra"
        @parametros="painelAberto = !painelAberto"
        @compartilhar="abrirCompartilhar"
      />

      <CompartilharCampanhaModal
        v-if="modalCompartilharAberto"
        :nome-inicial="campanha?.nome ?? ''"
        :conferencia="conferencia"
        :etapa-aprovacao="etapaAprovacao"
        :erro-envio="erroEnvio"
        @fechar="modalCompartilharAberto = false"
        @compartilhar="chat.enviarParaAprovacao"
      />

      <!-- Conteúdo centralizado de até 832px (AgentRes e Input do protótipo 427:694) -->
      <div class="conversa-conteudo">
        <!-- Aviso de campanha desatualizada no topo da conversa (427:694) -->
        <p
          v-if="etapaAprovacao === 'desatualizada'"
          class="chat-aviso-desatualizada"
          role="status"
        >
          A campanha mudou depois da simulação: simule de novo para compartilhar.
        </p>

        <div class="messages" aria-live="polite">
          <template v-for="mensagem in mensagens" :key="mensagem.chave">
            <FerramentasDropdown
              v-if="mensagem.papel === 'agente' && mensagem.events && mensagem.events.length > 0"
              :events="mensagem.events"
            />
            <MensagemSistema
              v-if="mensagem.papel === 'sistema'"
              :mensagem="mensagem"
              :carregando="Boolean(mensagem.simulacao_id && simulacoesCarregando.includes(mensagem.simulacao_id))"
              @ver-resultado="chat.carregarResultadoSimulacao"
              @aplicar-cenario="chat.aplicarCenario"
            />
            <ResultadoSimulacao
              v-else-if="mensagem.resultado"
              :resultado="mensagem.resultado"
              @aplicar-cenario="chat.aplicarCenario"
            />
            <SpeechBubble v-else :message="mensagem.texto" :papel="mensagem.papel" />
          </template>
          <p v-if="aguardandoLana" class="pensando">A Lana está escrevendo…</p>
          <p v-if="simulando" class="pensando">
            <template v-if="etapaSimulacao">{{ etapaSimulacao }} · </template>A Lana está gerando o código da regra e simulando sobre os dados reais…
          </p>

          <div class="flex items-center gap-3 self-start">
            <i class="bi bi-info-circle text-label text-gray-txt2-dark"></i>
            <p class="text-label text-gray-txt2-dark">Até a Lana pode cometer erros! Valide todas as informações antes de compartilhar uma campanha.</p>
          </div>
          <div ref="fimDaConversa" class="fim-da-conversa" />
        </div>

        <div v-if="podeVoltarRascunho" class="chat-voltar-rascunho">
          <p class="voltar-rascunho-texto">
            Esta campanha foi reprovada. Edite para voltar a conversar.
          </p>
          <button
            type="button"
            class="botao-editar-campanha"
            :disabled="aguardandoLana || simulando || editandoCampanha"
            @click="chat.editarCampanhaReprovada"
          >
            Editar campanha
          </button>
        </div>
        <div v-else class="chat-input">
          <Input :ocupado="ocupado" :placeholder="placeholderDoCampo" @send="chat.enviar" />
        </div>
      </div>
    </div>

    <!-- Painel de simulação (tab-simulacao, nó 641:1860): 500px, altura inteira da janela -->
    <aside
      v-if="regra && painelAberto"
      id="tab-simulacao"
      class="tab-simulacao"
    >
      <ParametrosPanel
        :regra="regra"
        :campos-vazios="camposVazios"
        :pode-simular="podeSimular"
        :simulando="simulando"
        :ocupado="ocupado"
        @alterar="chat.atualizarParametro"
        @simular="chat.simular"
        @fechar="painelAberto = false"
      />
    </aside>
  </div>
</template>

<style scoped>
/* Página do chat: sem limite fixo de 1000px na página quando há conversa (protótipo 427:694) */
.chat-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

/* Estado vazio (sem mensagens): centralizado na página, sem barra nem painel */
.chat-page.empty-state {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 24px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.conversa-vazia {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 56px;
}

.welcome {
  width: 100%;
  text-align: center;
  margin-bottom: 0;
}

.welcome h1 {
  color: var(--color-white-txt1);
  font-family: var(--font-forum);
  font-size: clamp(48px, 9vw, 96px);
  font-weight: 400;
  line-height: 1;
  margin: 0;
}

.welcome p {
  font-family: var(--font-forum);
  color: var(--color-white-txt2);
  font-size: clamp(24px, 4vw, 44px);
  line-height: 1.1;
  margin: -4px 0 0;
}

/* Coluna da conversa: ocupa toda a largura entre a sidebar e o painel */
.conversa {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Conteúdo da conversa centralizado em até 832px com 24px de respiro (427:694) */
.conversa-conteudo {
  width: 100%;
  max-width: 832px;
  margin: 0 auto;
  padding: 24px 24px 0;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
}

/* Frase da etapa desatualizada no topo da conversa (Leo, 28/10) */
.chat-aviso-desatualizada {
  color: var(--color-orange);
  font-family: var(--font-raleway);
  font-size: 13px;
  line-height: 1.4;
  margin: 0 0 16px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: color-mix(in srgb, var(--color-orange) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-orange) 30%, transparent);
  align-self: stretch;
  text-align: center;
}

.messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
  padding-bottom: 16px;
}

.chat-input {
  position: sticky;
  bottom: 0;
  width: 100%;
  padding-bottom: 16px;
  background-color: var(--color-black-bg1);
}

.chat-input--empty {
  padding-bottom: 0;
  background-color: transparent;
}

.chat-voltar-rascunho {
  position: sticky;
  bottom: 0;
  width: 100%;
  padding: 16px 0;
  background-color: var(--color-black-bg1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.voltar-rascunho-texto {
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 13px;
  text-align: center;
  margin: 0;
}

.botao-editar-campanha {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  border-radius: 8px;
  background-color: var(--color-blue);
  color: var(--color-black-bg1);
  font-family: var(--font-raleway);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}

.botao-editar-campanha:hover:not(:disabled) {
  opacity: 0.9;
}

.botao-editar-campanha:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Painel de simulação (tab-simulacao, nó 641:1860): 500px, altura inteira, colado à direita */
.tab-simulacao {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 500px;
  flex-shrink: 0;
  background-color: var(--color-black-bg2);
  display: flex;
  flex-direction: column;
  padding: 40px 42px;
  box-sizing: border-box;
  z-index: 20;
}

/* Em telas com menos de 1200px, o painel aberto vira gaveta por cima da conversa (427:694) */
@media (max-width: 1199px) {
  .tab-simulacao {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    width: min(500px, 100vw);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
    z-index: 50;
  }
}

@media (max-width: 600px) {
  .tab-simulacao {
    padding: 24px 16px;
  }
}

.fim-da-conversa {
  scroll-margin-bottom: 140px;
}

.pensando {
  align-self: flex-start;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 14px;
  font-style: italic;
}
</style>
