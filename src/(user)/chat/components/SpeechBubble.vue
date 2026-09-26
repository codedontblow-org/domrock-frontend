<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
    remetente?: 'user' | 'ia'
    simulado?: boolean
  }>(),
  {
    message:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam semper a urna eget faucibus. Sed sagittis in magna sed tristique.',
      remetente: 'user',
      simulado: false,
  },
)
</script>

<template>
  <div class="speech-bubble" :class="`speech-bubble--${remetente}`">
    {{ message }}
    <span v-if="simulado" class="speech-bubble__tag">(simulado)</span>
  </div>
</template>

<style scoped>
  .speech-bubble {
    display: inline-block;
    max-width: 448px;
    align-self: flex-end;
    padding: 8px 12px;
    border-radius: 6px 6px 0 6px;
    background-color: var(--color-blue);
    color: var(--color-white-txt1);
    font-family: var(--font-inconsolata);
    font-size: 12px;
    line-height: 1.2;
    white-space: pre-line;
  }
  .speech-bubble--user {
    align-self: flex-end;
    border-radius: 6px 6px 0 6px;
    background-color: var(--color-blue);
  }

  .speech-bubble--ia {
    align-self: flex-start;
    max-width: 100%;
    background-color: transparent;
    padding: 0;
  }

  .speech-bubble__tag {
    display: block;
    margin-top: 4px;
    color: var(--color-gray-txt3-dark);
    font-size: 10px;
    font-style: italic;
  }
</style>