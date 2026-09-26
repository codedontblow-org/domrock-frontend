<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Input from './components/Input.vue';
import SpeechBubble from './components/SpeechBubble.vue';
import ParametrosPanel from './components/ParametrosPanel.vue'
import ResultadoSimulacao from './components/ResultadoSimulacao.vue'
import { useChatStore } from './stores/chat'

const chat = useChatStore()
const { mensagens, regra, aguardandoLana, simulando, camposVazios, podeSimular } = storeToRefs(chat)
const fimDaConversa = ref<HTMLElement | null>(null)

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
          <ResultadoSimulacao v-if="mensagem.resultado" :resultado="mensagem.resultado" />
          <SpeechBubble v-else :message="mensagem.texto" :papel="mensagem.papel" />
        </template>
        <p v-if="aguardandoLana" class="pensando">A Lana está escrevendo…</p>
        <p v-if="simulando" class="pensando">A Lana está gerando o código da regra e simulando sobre os dados reais…</p>
        <div ref="fimDaConversa" class="fim-da-conversa" />
      </div>

      <div class="chat-input">
        <Input :ocupado="aguardandoLana || simulando" @send="chat.enviar"/>
      </div>
    </div>

    <aside v-if="regra" class="ficha-lateral">
      <ParametrosPanel
        :regra="regra"
        :campos-vazios="camposVazios"
        :pode-simular="podeSimular"
        :simulando="simulando"
        @alterar="chat.atualizarParametro"
        @simular="chat.simular"
      />
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

.conversa {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: inherit;
  justify-content: inherit;
}

.com-ficha {
  max-width: 1100px;
  flex-direction: row;
  align-items: flex-start;
  gap: 24px;
}

/* Fixa ao lado da conversa; o painel rola por dentro e o botão Simular fica sempre visível. */
.ficha-lateral {
  position: sticky;
  top: 16px;
  width: 360px;
  flex-shrink: 0;
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
  }

  /* No celular a ficha vem antes da conversa, para o usuário ver o que falta preencher. */
  .ficha-lateral {
    position: static;
    order: -1;
    width: 100%;
  }

  .ficha-lateral :deep(.ficha) {
    max-height: none;
  }
}
</style>