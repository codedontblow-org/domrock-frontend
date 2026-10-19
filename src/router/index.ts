import { createRouter, createWebHistory } from 'vue-router'
import SidebarLayout from '../layouts/SidebarLayout.vue'
import HomeView from '../views/HomeView.vue'
import ChatPage from '../(user)/chat/Page.vue'
import LoginPage from '../(auth)/login/Page.vue'
import AdminUsers from '../(admin)/users/Page.vue'
import CampanhaPage from '../(user)/campanha/Page.vue'
import VigentePage from '../(user)/vigente/Page.vue'
import RelatoriosPage from '../(user)/relatorios/Page.vue'
import ConfiguracoesPage from '../(user)/configuracoes/Page.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: SidebarLayout,
      children: [
        {
          path: '',
          name: 'chat',
          component: ChatPage,
        }
      ]
    },
    {
      path: '/admin',
      name: 'admin',
      component: SidebarLayout,
      children: [
        {
          path: '',
          name: 'users',
          component: AdminUsers,
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/:pathMatch(.*)',
      redirect: '/'
    }
  ],
})

// NAVIGATION GUARDS
router.beforeEach(async (to, from) => {
  const token = localStorage.getItem("token")
  const perfil = localStorage.getItem("perfil")

  // Sem token, só pode ficar em login
  if (!token && to.name !== 'login') {
    return { name: 'login' }
  }

  // Com token, não pode ir para login
  if (token && to.name === 'login') {
    return { name: 'chat' }
  }

  // Sem ser admin, não pode ver rotas do admin
  if (perfil !== 'ADMIN' && to.path.startsWith('/admin')) {
    return { name: 'chat' }
  }

  if (perfil === 'ADMIN' && to.path === '/') {
    return { name: 'admin' }
  }
})

export default router
