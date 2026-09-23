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
  <div class="relative inline-block max-w-md self-end">
    <div
      class="rounded-t-md rounded-bl-md bg-blue px-3 py-2 font-inconsolata text-xs leading-[1.2] text-white"
    >
      {{ message }}
    </div>

  </div>
</template>