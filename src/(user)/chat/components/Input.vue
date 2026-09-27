<script setup lang="ts">
import { nextTick, ref } from "vue";
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
const campo = ref<HTMLTextAreaElement | null>(null);
const ALTURA_MAXIMA = 160;

// Cresce com o texto, como o campo de mensagem do ChatGPT; passa a rolar depois do limite.
function ajustarAltura(): void {
  const textarea = campo.value;
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, ALTURA_MAXIMA)}px`;
}

function handleSend() {
  const text = message.value.trim();
  if (!text || props.ocupado) return;

  emit("send", text);
  message.value = "";
  nextTick(ajustarAltura);
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
      ref="campo"
      v-model="message"
      rows="1"
      :placeholder="placeholder"
      :aria-label="placeholder || 'Mensagem para a Lana'"
      class="chat-textarea"
      @input="ajustarAltura"
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
  min-height: 56px;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 16px;
  border-radius: 12px;
  background-color: var(--color-black-bg2);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 5%);
  transition: box-shadow 0.2s;
  }

  .chat-input:focus-within {
    box-shadow: 0 0 0 1px rgb(0 180 241 / 40%);
  }

  .chat-textarea {
    flex: 1;
    max-height: 160px;
    padding: 8px 0;
    border: none;
    outline: none;
    resize: none;
    overflow-y: auto;
    background-color: transparent;
    color: var(--color-white-txt1);
    font-family: var(--font-raleway);
    font-size: 15px;
    line-height: 1.45;
  }

  .chat-textarea::placeholder {
    color: var(--color-gray-txt3-dark);
  }

  .chat-actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
  }
</style>