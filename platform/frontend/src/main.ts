import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './style.css'
import './course.css'
import { handleDemoDownload } from './demo'

document.addEventListener('click', handleDemoDownload)

createApp(App).use(createPinia()).use(router).mount('#app')
