<script setup lang="ts">
import { ref } from 'vue'
import type { MenuItem, Chat, User } from '@/types/sidebar'

const menuItems: MenuItem[] = [
    //pluscircle  
    { id: 'nova-campanha', label: 'Nova Campanha', icon: 'bi bi-plus-circle' },
    //piggybank
    { id: 'campanhas', label: 'Campanhas', icon: 'bi bi-piggy-bank' },
    //calendar4event
    { id: 'agendado', label: 'Agendado', icon: 'bi bi-calendar4-event' },
    //clipboard
    { id: 'relatorios', label: 'Relatórios', icon: 'bi bi-clipboard' },
    //gear
    { id: 'configuracoes', label: 'Configurações', icon: 'bi bi-gear' }
]

const chats = ref<Chat[]>([
  { id: 1, titulo: 'Títulos do chat', data: '16/11' },
  { id: 2, titulo: 'Títulos do chat', data: '16/11' },
  { id: 3, titulo: 'Títulos do chat', data: '16/11' },
  { id: 4, titulo: 'Títulos do chat', data: '16/11' },
  { id: 5, titulo: 'Títulos do chat', data: '16/11' }
])

const user = ref<User>({
  nome: 'Roberval Silva',
  cargo: 'Gerente de Vendas'
})

const activeItem = ref<string>('nova-campanha')

function selectItem(id: string): void {
  activeItem.value = id
}
</script>

<template>
  <aside class="sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <span class="text-header-2 text-white-txt1 font-inconsolata">CAMP<strong class="text-blue">LANA</strong></span>
      <button class="toggle-btn">
        <i class="bi bi-layout-sidebar text-sm"></i>
      </button>
    </div>

    <!-- Menu de navegação -->
    <nav class="sidebar-menu">
      <button
        v-for="item in menuItems"
        :key="item.id"
        class="menu-item"
        :class="{ active: activeItem === item.id }"
        @click="selectItem(item.id)"
      >
        <i :class="item.icon" ></i>
        <span class="text-highlight-2 font-raleway">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Lista de chats -->
    <div class="sidebar-chats">
      <div class="chats-header">
        <span class="text-body  text-gray-txt2">Seus Chats</span>
        <i class="bi bi-arrow-down-up"></i>
      </div>

      <ul class="chats-list">
        <li v-for="chat in chats" :key="chat.id" class="chat-item">
          <span class="chat-title text-label font-inconsolata">{{ chat.titulo }}</span>
          <span class="chat-date text-metadata font-inconsolata">{{ chat.data }}</span>
        </li>
      </ul>
    </div>

    <!-- Footer do usuário -->
    <div class="sidebar-footer">
      <div class="user-info">
        <span class="user-name text-body">{{ user.nome }}</span>
        <span class="user-role text-metadata">{{ user.cargo }}</span>
      </div>
      <button class="logout-btn">
        <i class="bi bi-power"></i>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex: 0 0 260px;
  flex-direction: column;
  width: 260px;
  height: 100vh;
  background-color:var(--color-black-bg2);
  color: var(--color-white-txt1);
  padding: 16px;
  box-sizing: border-box;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}


.toggle-btn {
  background: none;
  border: none;
  color: var(--color-white-txt1);
  cursor: pointer;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 24px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  color: var(--color-white-txt1);
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
}

.menu-item:hover {
  background-color: #2a2a2a;
}

.menu-item.active {
  background-color: #2f2f2f;
  color: var(--color-white-txt1);
}

.sidebar-chats {
  flex: 1;
  overflow-y: auto;
}

.chats-header {
  display: flex;
  justify-content: space-between;
  color: var(--color-white-txt1);
  font-size: 12px;
  margin-bottom: 8px;
  padding: 0 8px;
}

.chats-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.chat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 8px;
  font-size: 13px;
  color: var(--color-white-txt1);
  border-radius: 6px;
  cursor: pointer;
}

.chat-item:hover {
  background-color: #2a2a2a;
}

.chat-date {
  color: var(--color-gray-txt2 );
  font-size: 11px;
}

.sidebar-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--color-gray-txt3);
}

.user-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
}

.user-role {
  display: block;
  font-size: 11px;
  color: var(--color-gray-txt2);
}

.logout-btn {
  background: none;
  border: none;
  color: var(--color-white-txt1);
  cursor: pointer;
}
</style>