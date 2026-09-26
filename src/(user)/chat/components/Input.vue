<script setup lang="ts">
import { ref } from "vue";
import Button from '@/components/Button.vue'

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    // Enquanto a Lana responde ou simula: dá para digitar, mas não para enviar.
    ocupado?: boolean;
  }>(),
  {
    placeholder: "Descreva sua campanha para a Lana!",
    ocupado: false,
  },
);

const emit = defineEmits<{
  send: [text: string];
  "record-start": [];
  "record-stop": [];
}>();

const message = ref("");
const isRecording = ref(false);

function handleSend() {
  const text = message.value.trim();
  if (!text || props.ocupado) return;

  emit("send", text);
  message.value = "";
}

function toggleRecording(): void {
  isRecording.value = !isRecording.value

  if (isRecording.value) {
    emit("record-start");
  } else {
    emit("record-stop");
  }
}
</script>

<template>
  <div
    class="chat-input"
  >
    <textarea
      v-model="message"
      rows="1"
      :placeholder="placeholder"
      class="chat-textarea"
      @keydown.enter.exact.prevent="handleSend"
    />

<div class="chat-actions">
  <Button
    v-if="!message.trim()"
    variant="record"
    :active="isRecording"
    @click="toggleRecording"
  />

  <Button
    v-else
    variant="send"
    :disabled="ocupado"
    @click="handleSend"
  />
</div>
  </div>
</template>

<style scoped>
  .chat-input {
  display: flex;
  height: 100px;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border-radius: 6px;
  background-color: var(--color-black-bg2);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 5%);
  transition: box-shadow 0.2s;
  }

  .chat-input:focus-within {
    box-shadow: 0 0 0 1px rgb(0 180 241 / 40%);
  }

  .chat-textarea {
    height: 100%;
    flex: 1;
    padding: 14px 0;
    border: none;
    outline: none;
    resize: none;
    overflow-y: auto;
    background-color: transparent;
    color: var(--color-white-txt1);
    font-size: 16px;
    line-height: 1.4;
  }

  .chat-textarea::placeholder {
    color: var(--color-gray-txt3-dark);
    font-family: var(--font-inconsolata);
  }

  .chat-actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
  }
</style>