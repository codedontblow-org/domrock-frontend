<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
  }>(),
  {
    message:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam semper a urna eget faucibus. Sed sagittis in magna sed tristique.',
  },
)
</script>

<template>
  <div class="speech-bubble">
    {{ message }}
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
  }
</style>