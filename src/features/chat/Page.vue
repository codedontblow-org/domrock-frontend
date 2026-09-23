<script setup lang="ts">
import Input from './components/Input.vue';
import SpeechBubble from './components/SpeechBubble.vue';
import Button from '@/components/Button.vue';

</script>

<template>
  <div class="flex min-h-screen flex-col">
    <div class="flex-1 p-4">
      <SpeechBubble />
    </div>

    <div class="px-4 pb-6">
      <Input />
    </div>
  </div>
</template>

