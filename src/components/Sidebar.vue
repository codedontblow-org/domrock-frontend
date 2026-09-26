<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import logo from '@/assets/logo.svg'
import type { MenuItem, Chat, User } from '@/types/sidebar'

// Abaixo desta largura a barra começa recolhida e, aberta, fica por cima do conteúdo.
const CONSULTA_CELULAR = '(max-width: 900px)'

const isCollapsed = ref(false)
const isMobile = ref(false)
let consultaCelular: MediaQueryList | null = null

function toggleSidebar(): void {
  isCollapsed.value = !isCollapsed.value
}

function acompanharLargura(consulta: MediaQueryList | MediaQueryListEvent): void {
  isMobile.value = consulta.matches
  isCollapsed.value = consulta.matches
}

onMounted(() => {
  consultaCelular = window.matchMedia(CONSULTA_CELULAR)
  acompanharLargura(consultaCelular)
  consultaCelular.addEventListener('change', acompanharLargura)
})

onBeforeUnmount(() => consultaCelular?.removeEventListener('change', acompanharLargura))

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
  if (isMobile.value) isCollapsed.value = true
}
</script>

<template>
  <div v-if="isMobile && !isCollapsed" class="sidebar-fundo" aria-hidden="true" @click="toggleSidebar" />
  <aside 
    class="sidebar"
    :class="{
      'sidebar--collapsed': isCollapsed,
      'sidebar--sobreposta': isMobile && !isCollapsed,
      'sidebar--flutuante': isMobile && isCollapsed,
    }">
    <div class="sidebar-header">
      <span class="brand-name">
        CAMP<strong class="brand-accent">LANA</strong>
      </span>

      <img :src="logo" alt="Logo" class="logo" />

      <button 
        class="toggle-btn"
        type="button"
        aria-label="Alternar barra lateral"
        :aria-expanded="!isCollapsed"
        @click="toggleSidebar">
        <i class="sidebar-icon bi bi-layout-sidebar"></i>
      </button>
    </div>

    <nav class="sidebar-menu">
      <button
        v-for="item in menuItems"
        :key="item.id"
        class="menu-item"
        :class="{ active: activeItem === item.id }"
        @click="selectItem(item.id)"
      >
        <i :class="[item.icon, 'menu-icon']"></i>
        <span class="menu-label">{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar-chats">
      <div class="chats-header">
        <span class="chats-title">Seus Chats</span>
        <i class="chats-sort-icon bi bi-arrow-down-up"></i>
      </div>

      <ul class="chats-list">
        <li
          v-for="chat in chats"
          :key="chat.id"
          class="chat-item"
        >
          <span class="chat-title">{{ chat.titulo }}</span>
          <span class="chat-date">{{ chat.data }}</span>
        </li>
      </ul>
    </div>

    <div class="sidebar-footer">
      <div class="user-info">
        <span class="user-name">{{ user.nome }}</span>
        <span class="user-role">{{ user.cargo }}</span>
      </div>

      <button class="logout-btn">
        <i class="logout-icon bi bi-power"></i>
      </button>
    </div>
  </aside>
</template>

<style scoped>

.logo {
  width: 32px;
  height: auto;
  display: block;
  margin-left: 8px;
}

.sidebar {
  transition: 
    width 0.25s ease,
    flex-basis 0.25s ease,
    padding 0.25s ease;
  display: flex;
  flex: 0 0 260px;
  flex-direction: column;
  width: 260px;
  /* Acompanha a rolagem: a conversa rola, a barra fica na altura da janela. */
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100dvh;
  background-color:var(--color-black-bg2);
  color: var(--color-white-txt1);
  padding: 16px;
  box-sizing: border-box;
}

.sidebar--collapsed {
  flex-basis: 56px;
  width: 56px;
  padding: 16px 8px;
}

.sidebar--collapsed .sidebar-header {
  justify-content: center;
  margin-bottom: 0;
}

.sidebar--collapsed .brand-name,
.sidebar--collapsed .logo,
.sidebar--collapsed .sidebar-menu,
.sidebar--collapsed .sidebar-chats,
.sidebar--collapsed .sidebar-footer {
  display: none;
}

.sidebar--collapsed .toggle-btn {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  margin-left: 0;
  padding: 0;
}

.sidebar--sobreposta {
  position: fixed;
  z-index: 30;
  left: 0;
  box-shadow: 8px 0 24px rgb(0 0 0 / 45%);
}

/* Celular recolhido: sobra só o botão de abrir, flutuando, e a conversa usa a largura toda. */
.sidebar--flutuante {
  position: fixed;
  z-index: 30;
  top: 10px;
  left: 10px;
  width: auto;
  height: auto;
  flex-basis: auto;
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 40%);
}

.sidebar-fundo {
  position: fixed;
  z-index: 29;
  inset: 0;
  background-color: rgb(0 0 0 / 50%);
}

.toggle-btn:focus-visible,
.menu-item:focus-visible,
.logout-btn:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}

.sidebar-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 24px;
}


.toggle-btn {
  margin-left: auto;
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

.brand-name {
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: 24px;
  line-height: 28px;
}

.brand-accent {
  color: var(--color-blue);
}

.sidebar-icon {
  font-size: 14px;
}

.menu-icon {
  width: 18px;
  color: var(--color-white-txt1);
  font-size: 16px;
}

.menu-label {
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  font-size: 16px;
  line-height: 18px;
}

.chats-title {
  color: var(--color-gray-txt2);
  font-size: 16px;
  line-height: 16px;
}

.chats-sort-icon {
  color: var(--color-gray-txt2);
  font-size: 14px;
}

.chat-title {
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: 14px;
  line-height: 15px;
}

.chat-date {
  color: var(--color-gray-txt2);
  font-family: var(--font-inconsolata);
  font-size: 12px;
  line-height: 12px;
}

.user-name {
  display: block;
  color: var(--color-white-txt1);
  font-size: 16px;
  line-height: 16px;
  font-weight: 600;
}

.user-role {
  display: block;
  margin-top: 4px;
  color: var(--color-gray-txt2);
  font-size: 12px;
  line-height: 12px;
}

.logout-icon {
  font-size: 16px;
}
</style>