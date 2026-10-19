<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue'
</script>

<template>
    <Sidebar />
    <main class="page-content">
        <div class="content-container">
            <RouterView />
        </div>
    </main>
</template>

<style scoped>
.page-content {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Sem limite de largura aqui: cada página decide. O chat centraliza a conversa e, com a ficha
   da campanha, encosta a ficha na borda direita em vez de deixar uma sobra vazia. */
.content-container {
  width: 100%;
  min-height: 100vh;
}
</style>