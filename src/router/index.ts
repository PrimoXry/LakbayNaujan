import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { supabase } from '../lib/supabase';
import { destinationForUser } from '../lib/auth';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/LoginPage.vue') },
  { path: '/signup', redirect: '/login' },
  { path: '/verify', redirect: '/login' },
  { path: '/auth/callback', component: () => import('../views/GoogleCallbackPage.vue') },
  { path: '/tourists', component: () => import('../views/TouristListPage.vue'), meta: { requiresAuth: true } },
  { path: '/tourists/:id', component: () => import('../views/TouristDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/admin', component: () => import('../views/AdminPage.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes });

router.beforeEach(async (to) => {
  // Let the callback view wait for Supabase to finish the OAuth redirect.
  if (to.path === '/auth/callback') return true;

  const { data: { user } } = await supabase.auth.getUser();
  if (to.meta.requiresAuth && !user) return '/login';

  if (to.meta.requiresAdmin) {
    if (!user) return '/login';
    try {
      if ((await destinationForUser(user.id)) !== '/admin') return '/tourists';
    } catch {
      return '/tourists';
    }
  }

  if (user && to.path === '/login') {
    try {
      return await destinationForUser(user.id);
    } catch {
      // Stay on login if profiles table / role lookup needs fixing.
    }
  }
  return true;
});

export default router;
