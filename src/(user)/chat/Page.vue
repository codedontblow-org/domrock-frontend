<script setup lang="ts">
import Input from './components/Input.vue';
import SpeechBubble from './components/SpeechBubble.vue';
import Button from '@/components/Button.vue';
import {ref} from 'vue'

const messages = ref(["Hello world!", "The quicl brown fox jumps over the lazy dog", "Sphinx of black quartz, judge my vow!", "Lorem ipsum dolor sit amet."])

</script>

<template>
  <div class="mx-auto flex min-h-screen flex-col w-full">
    <div class="flex flex-1 flex-col gap-2 items-end p-4">
      <SpeechBubble v-for="m in messages" :message="m"/>
    </div>

    <div class="px-4 pb-6">
      <Input />
    </div>
  </div>
</template>

