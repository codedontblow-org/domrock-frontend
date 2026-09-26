<script setup lang="ts">
import {ref} from 'vue'
import Input from './components/Input.vue';
import SpeechBubble from './components/SpeechBubble.vue';

const messages = ref<string[]>([])

function handleSend(message: string): void {
  messages.value.push(message)
}
</script>

<template>
  <div 
    class="chat-page"
    :class="{'empty-state': messages.length === 0 }">
    <div v-if="messages.length === 0" class="welcome">
      <h1>Olá, Roberval!</h1>
      <p>O que você tem em mente hoje?</p>
    </div>

    <div v-else class="messages">
      <SpeechBubble
        v-for="(message, index) in messages"
        :key="index"
        :message="message"
      />
    </div>

    <div class="chat-input">
      <Input @send="handleSend"/>
    </div>
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
  padding: 20px 0 16px 0;
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
  font-size: 96px;
  font-weight: 400;
  line-height: 1;
  margin: 0;
}

.welcome p {
  font-family: var(--font-forum);
  color: var(--color-white-txt2);
  font-size: 44px;
  line-height: 1.1;
  margin: -4px 0 0;
}

.messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  padding-bottom: 16px;
}

.chat-input {
  width: 100%;
}
</style>