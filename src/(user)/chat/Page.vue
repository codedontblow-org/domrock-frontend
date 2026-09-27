<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Input from './components/Input.vue';
import SpeechBubble from './components/SpeechBubble.vue';
import ParametrosPanel from './components/ParametrosPanel.vue'
import ResultadoSimulacao from './components/ResultadoSimulacao.vue'
import { useChatStore } from './stores/chat'

const chat = useChatStore()
const { mensagens, regra, aguardandoLana, simulando, camposVazios, podeSimular } = storeToRefs(chat)
const fimDaConversa = ref<HTMLElement | null>(null)
// Recolher a ficha dá a largura toda ao chat (útil para ler o resultado da simulação).
const fichaRecolhida = ref(false)
const statusFicha = computed(() => {
  const faltam = camposVazios.value.length
  if (faltam === 0) return 'pronta para simular'
  return faltam === 1 ? '1 campo pendente' : `${faltam} campos pendentes`
})
// Depois da primeira troca, o convite inicial some: a conversa já diz o que fazer.
const placeholderDoCampo = computed(() =>
  mensagens.value.length === 0 ? 'Descreva sua campanha para a Lana' : 'Responder à Lana',
)

// Mantém a última mensagem (ou o resultado) visível quando algo novo chega.
watch(() => mensagens.value.length, async () => {
  await nextTick()
  fimDaConversa.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
})
</script>

<template>
  <div
    class="chat-page"
    :class="{'empty-state': mensagens.length === 0, 'com-ficha': regra }">
    <div class="conversa">
      <div v-if="mensagens.length === 0" class="welcome">
        <h1>Olá, Roberval!</h1>
        <p>O que você tem em mente hoje?</p>
      </div>

      <div v-else class="messages" aria-live="polite">
        <template v-for="mensagem in mensagens" :key="mensagem.id">
          <ResultadoSimulacao v-if="mensagem.resultado" :resultado="mensagem.resultado"
            @aplicar-cenario="chat.aplicarCenario" />
          <SpeechBubble v-else :message="mensagem.texto" :papel="mensagem.papel" />
        </template>
        <p v-if="aguardandoLana" class="pensando">A Lana está escrevendo…</p>
        <p v-if="simulando" class="pensando">A Lana está gerando o código da regra e simulando sobre os dados reais…</p>
        <div ref="fimDaConversa" class="fim-da-conversa" />
      </div>

      <div class="chat-input">
        <Input :ocupado="aguardandoLana || simulando" :placeholder="placeholderDoCampo" @send="chat.enviar"/>
      </div>
    </div>

    <!-- Um só painel que muda de largura, com a mesma transição da sidebar (0,25 s). -->
    <aside v-if="regra" class="ficha-lateral" :class="{ 'ficha-lateral--recolhida': fichaRecolhida }">
      <div class="ficha-conteudo" :inert="fichaRecolhida ? true : undefined">
        <ParametrosPanel
          :regra="regra"
          :campos-vazios="camposVazios"
          :pode-simular="podeSimular"
          :simulando="simulando"
          @alterar="chat.atualizarParametro"
          @simular="chat.simular"
          @recolher="fichaRecolhida = true"
        />
      </div>
      <!-- Recolhida, a faixa inteira é o botão de abrir: alvo grande, fácil de acertar. -->
      <button type="button" class="ficha-trilho" :tabindex="fichaRecolhida ? 0 : -1"
        :aria-hidden="!fichaRecolhida" aria-label="Abrir o painel da campanha" title="Abrir o painel da campanha"
        @click="fichaRecolhida = false">
        <i class="bi bi-layout-sidebar-inset-reverse ficha-trilho-icone" aria-hidden="true" />
        <span class="ficha-trilho-nome">
          <span class="ficha-trilho-ponto" :class="camposVazios.length ? 'ponto--pendente' : 'ponto--pronta'" />
          Campanha, {{ statusFicha }}
        </span>
      </button>
    </aside>
  </div>
</template>


<style scoped>
.chat-page {
  width: 100%;
  max-width: 1000px;
  min-height: 100vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: 20px 24px 0;
}

.empty-state {
  gap: 56px;
  justify-content: center;
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

.messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  padding-bottom: 16px;
}

.chat-input {
  position: sticky;
  bottom: 0;
  width: 100%;
  padding-bottom: 16px;
  background-color: var(--color-black-bg1);
}

/* Na tela inicial o campo fica no meio da página: sem o fundo que o separa da conversa. */
.empty-state .chat-input {
  padding-bottom: 0;
  background-color: transparent;
}

.conversa {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: inherit;
  justify-content: inherit;
}

/* Com a ficha, a página usa a largura toda: a ficha encosta na borda direita (16 px) e a
   conversa fica centralizada no espaço que sobra, como o canvas do ChatGPT. */
.com-ficha {
  max-width: none;
  flex-direction: row;
  align-items: flex-start;
  gap: 20px;
  padding-right: 16px;
}

.com-ficha .conversa {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
}

.ficha-lateral {
  position: sticky;
  top: 16px;
  width: 360px;
  flex-shrink: 0;
  border-radius: 10px;
  background-color: var(--color-black-bg2);
  overflow: hidden;
  transition: width 0.25s ease;
}

.ficha-lateral--recolhida {
  width: 44px;
}

/* O conteúdo mantém a largura aberta e é cortado enquanto a ficha encolhe, sem reflow. */
.ficha-conteudo {
  width: 360px;
  transition: opacity 0.15s ease;
}

.ficha-lateral--recolhida .ficha-conteudo {
  opacity: 0;
}

.ficha-trilho {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border: none;
  border-radius: inherit;
  background-color: var(--color-black-bg2);
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, background-color 0.15s, color 0.15s;
}

.ficha-lateral--recolhida .ficha-trilho {
  opacity: 1;
  pointer-events: auto;
  transition-delay: 0.1s, 0s, 0s;
}

.ficha-trilho:hover {
  background-color: color-mix(in srgb, var(--color-white-txt1) 6%, var(--color-black-bg2));
  color: var(--color-white-txt1);
}

.ficha-trilho:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: -2px;
}

.ficha-trilho-icone {
  font-size: 16px;
}

/* O nome fica na vertical, como as abas recolhidas do Linear e do Figma. */
.ficha-trilho-nome {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  white-space: nowrap;
  writing-mode: vertical-rl;
}

.ficha-trilho-ponto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.ponto--pendente {
  background-color: var(--color-orange);
}

.ponto--pronta {
  background-color: var(--color-green);
}

.fim-da-conversa {
  /* A caixa de mensagem é fixa no rodapé; sem a margem, o fim do resultado ficaria atrás dela. */
  scroll-margin-bottom: 140px;
}

.pensando {
  align-self: flex-start;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: 14px;
  font-style: italic;
}

@media (max-width: 900px) {
  /* Espaço no topo para o botão flutuante da barra lateral. */
  .chat-page {
    padding: 60px 16px 0;
  }

  .com-ficha {
    flex-direction: column;
    align-items: stretch;
    padding-right: 16px;
  }

  /* No celular a ficha vem antes da conversa, para o usuário ver o que falta preencher. */
  .ficha-lateral {
    position: static;
    order: -1;
    width: 100%;
  }

  .ficha-lateral--recolhida {
    width: 100%;
    height: 44px;
  }

  .ficha-conteudo {
    width: 100%;
  }

  .ficha-lateral :deep(.ficha) {
    max-height: none;
  }

  .ficha-trilho {
    flex-direction: row;
    padding: 0 14px;
  }

  .ficha-trilho-nome {
    writing-mode: horizontal-tb;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ficha-lateral,
  .ficha-conteudo,
  .ficha-trilho {
    transition: none;
  }
}
</style>