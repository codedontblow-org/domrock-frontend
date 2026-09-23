<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <main class="page-content">
      <div class="content-container">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.page-content {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.content-container {
  width: 100%;
  max-width: 1100px;
  min-height: 100vh;
}
</style>