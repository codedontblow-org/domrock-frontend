<script setup lang="ts">
defineProps<{
  enabled?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="h-12 w-24 rounded-md border border-cyan-500 px-3 font-inconsolata text-base cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
    :class="
      enabled
        ? 'bg-cyan-500 text-white'
        : 'bg-transparent text-cyan-400'
    "
    @click="emit('click')"
  >
    <slot />
  </button>
</template>