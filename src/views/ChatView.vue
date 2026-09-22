<script setup lang="ts">
import Input from '@/components/chat/Input.vue';
import SpeechBubble from '@/components/chat/SpeechBubble.vue';
import Button from '@/components/chat/Button.vue';

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

