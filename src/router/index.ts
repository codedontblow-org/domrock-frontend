import { createRouter, createWebHistory } from 'vue-router'
import SidebarLayout from '../layouts/SidebarLayout.vue'
import HomeView from '../views/HomeView.vue'
import ChatPage from '../(user)/chat/Page.vue'
import LoginPage from '../(auth)/login/Page.vue'

const router = createRouter({
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
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
  ],
})

export default router
