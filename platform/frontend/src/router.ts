import { createRouter, createWebHistory } from 'vue-router'
import { demoMode } from './demo'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: () => import('./pages/OverviewPage.vue'), meta: { title: '项目总览' } },
    { path: '/explore', component: () => import('./pages/ExplorePage.vue'), meta: { title: '空间探索' } },
    { path: '/inquiry', component: () => import('./pages/InquiryPage.vue'), meta: { title: '专题探究' } },
    { path: '/archive', component: () => import('./pages/ArchivePage.vue'), meta: { title: '科考档案馆' } },
    { path: '/outcomes', component: () => import('./pages/OutcomesPage.vue'), meta: { title: '成果交流' } },
    { path: '/feedback', component: () => import('./pages/FeedbackPage.vue'), meta: { title: '学习反馈' } },
    { path: '/library', component: () => import('./pages/LibraryPage.vue'), meta: { title: '课程资料库' } },
    { path: '/review', component: () => import('./pages/ReviewPage.vue'), meta: { title: '地理组对接清单' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(to => { if (demoMode && to.query.demo !== '1') return { ...to, query: { ...to.query, demo: '1' } } })

router.afterEach((to) => {
  document.title = `${to.meta.title || '项目总览'} · 天目·寻境`
})
