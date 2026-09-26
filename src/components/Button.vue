<script setup lang="ts">
type ButtonVariant = 'send' | 'record'

const props = withDefaults(
  defineProps<{
    variant: ButtonVariant
    disabled?: boolean
    active?: boolean
  }>(),
  {
    disabled: false,
    active: false,
  },
)

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="chat-button"
    :class="{
      'chat-button--send': props.variant === 'send',
      'chat-button--record': props.variant === 'record',
      'chat-button--active': props.variant === 'record' && props.active,
      'chat-button--disabled': props.disabled,
    }"
    :disabled="props.disabled"
    :aria-pressed="props.variant === 'record' ? props.active : undefined"
    :aria-label="
      props.variant === 'send' ? 'Enviar mensagem' : 'Gravar áudio'
    "
    @click="emit('click')"
  >
  <i
    v-if="props.variant === 'send'"
    class="button-icon button-icon--send bi bi-send-fill"
  ></i>

  <i
    v-else
    class="button-icon button-icon--record"
    :class="props.active ? 'bi bi-mic-fill' : 'bi bi-mic'"
  ></i>
  </button>
</template>

<style scoped>
  .chat-button {
    display: flex;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: opacity 0.2s, background-color 0.2s;
  }

  .chat-button:hover {
    opacity: 0.9;
  }

  .chat-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .chat-button--send {
    background-color: var(--color-blue);
    color: var(--color-white-bg1);
  }

  .chat-button--record {
    background-color: var(--color-black-bg1);
    color: var(--color-gray-txt3-dark);
    box-shadow: 0 0 0 1px rgb(255 255 255 / 10%);
  }

  .chat-button--record:hover {
    color: var(--color-white-txt1);
  }

  .chat-button--active {
    background-color: var(--color-red);
    color: var(--color-white-txt1);
  }

  .button-icon {
  font-size: 14px;
  }

  .button-icon--send {
    color: var(--color-white-bg1);
  }

  .button-icon--record {
    font-size: 16px;
  }

  .chat-button--active .button-icon--record {
    color: var(--color-white-txt1);
  }  
</style>