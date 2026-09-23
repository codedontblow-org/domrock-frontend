import './assets/main.css'
import './assets/global.css'
import './assets/fonts.ts'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

document.documentElement.classList.add('dark')

app.mount('#app')
