import { createRouter, createWebHistory } from 'vue-router'

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
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  document.title = `${to.meta.title || '项目总览'} · 天目·寻境`
})
