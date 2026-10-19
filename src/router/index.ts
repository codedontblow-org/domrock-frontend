import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChatPage from '../(user)/chat/Page.vue'
import CampanhaPage from '../(user)/campanha/Page.vue'
import VigentePage from '../(user)/vigente/Page.vue'
import RelatoriosPage from '../(user)/relatorios/Page.vue'
import ConfiguracoesPage from '../(user)/configuracoes/Page.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatPage,
    },
     {
      path: '/campanha',
      name: 'campanha',
      component: CampanhaPage,
    },
    {
      path: '/vigente',
      name: 'vigente',
      component: VigentePage,
    },
    {
      path: '/relatorios',
      name: 'relatorios',
      component: RelatoriosPage,
    },
    {
      path: '/configuracoes',
      name: 'configuracoes',
      component: ConfiguracoesPage,
    },
  ],
})

export default router
