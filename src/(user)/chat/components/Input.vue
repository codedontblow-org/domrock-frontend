<script setup lang="ts">
import { ref } from "vue";

withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  {
    placeholder: "Descreva sua campanha para a Lana!",
  },
);

const emit = defineEmits<{
  send: [text: string];
  "record-start": [];
  "record-stop": [];
}>();

const message = ref("");
const isRecording = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function handleSend() {
  const text = message.value.trim();
  if (!text) return;

  emit("send", text);
  message.value = "";
}

function toggleRecording() {
  isRecording.value = !isRecording.value;

  if (isRecording.value) {
    emit("record-start");
  } else {
    emit("record-stop");
  }
}
</script>

<template>
  <div
    class="flex h-16 items-center gap-2 rounded-md bg-black-bg2 px-4 shadow-sm ring-1 ring-white/5 focus-within:ring-blue/40 transition-colors"
  >
    <textarea
      ref="textareaRef"
      v-model="message"
      rows="1"
      :placeholder="placeholder"
      class="flex-1 h-full resize-none overflow-y-auto bg-transparent text-body leading-[1.4] text-white-txt1 placeholder-gray-txt3-dark placeholder:font-inconsolata outline-none py-3.5"
      @keydown.enter.exact.prevent="handleSend"
    />

    <div class="flex shrink-0 items-center gap-2">
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black-bg1 text-gray-txt3-dark ring-1 ring-white/10 transition-colors hover:text-white-txt1"
        :aria-pressed="isRecording"
        aria-label="Gravar áudio"
        @click="toggleRecording"
      >
        <i :class="['bi', isRecording ? 'bi-mic-fill text-red' : 'bi-mic']" class="text-base"></i>
      </button>

      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue text-white-bg1 transition-opacity  disabled:cursor-not-allowed"
        aria-label="Enviar mensagem"
        :disabled="!message.trim()"
        @click="handleSend"
      >
        <i class="bi bi-send-fill text-sm"></i>
      </button>
    </div>
  </div>
</template>

