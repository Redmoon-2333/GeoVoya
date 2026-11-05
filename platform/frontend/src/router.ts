import { createRouter, createWebHistory } from 'vue-router'
import { demoMode } from './demo'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: () => import('./pages/OverviewPage.vue'), meta: { title: '课程入口' } },
    { path: '/explore', component: () => import('./pages/ExplorePage.vue'), meta: { title: '空间探索' } },
    { path: '/inquiry', component: () => import('./pages/InquiryPage.vue'), meta: { title: '专题探究' } },
    { path: '/archive', component: () => import('./pages/ArchivePage.vue'), meta: { title: '科考档案馆' } },
    { path: '/outcomes', component: () => import('./pages/OutcomesPage.vue'), meta: { title: '成果交流' } },
    { path: '/feedback', component: () => import('./pages/FeedbackPage.vue'), meta: { title: '学习反馈' } },
    { path: '/library', component: () => import('./pages/LibraryPage.vue'), meta: { title: '课程资料库' } },
    { path: '/methods', component: () => import('./pages/MethodsPage.vue'), meta: { title: '望闻问切' } },
    { path: '/geography', redirect: '/geography/tianmu' },
    { path: '/geography/tianmu', component: () => import('./pages/GeographyPage.vue'), meta: { title: '垂直地带性探究' } },
    { path: '/geography/atlas', component: () => import('./pages/GeographyPage.vue'), meta: { title: '星球植被图鉴' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(to => {
  const tab = to.path === '/archive' ? String(to.query.tab) : ''
  if (tab === 'workbench' || tab === 'board') {
    const { tab: _tab, ...rest } = to.query
    return { path: '/inquiry', query: demoMode && rest.demo !== '1' ? { ...rest, tab, demo: '1' } : { ...rest, tab } }
  }
  if (demoMode && to.query.demo !== '1') return { ...to, query: { ...to.query, demo: '1' } }
})

router.afterEach((to) => {
  document.title = `${to.meta.title || '课程入口'} · 天目·寻境`
})
