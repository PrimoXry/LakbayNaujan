import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { isAuthSessionMissingError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { destinationForUser } from '../lib/auth';

const routes: Array<RouteRecordRaw> = [
  { path: '/homepage', component: () => import('../views/HomePage.vue') },
  { path: '/about', component: () => import('../views/AboutUsPage.vue') },
  { path: '/', redirect: '/homepage' },
  { path: '/login', component: () => import('../views/LoginPage.vue') },
  { path: '/signup', component: () => import('../views/SignupPage.vue') },
  { path: '/verify', component: () => import('../views/VerifyEmailPage.vue') },
  { path: '/auth/callback', component: () => import('../views/GoogleCallbackPage.vue') },
  { path: '/tourists', component: () => import('../views/TouristListPage.vue'), meta: { requiresAuth: true } },
  { path: '/tourists/:id', component: () => import('../views/TouristDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/admin', component: () => import('../views/AdminPage.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes });

router.beforeEach(async (to) => {
  // Public signup/verification pages must remain reachable during an auth outage.
  if (!to.meta.requiresAuth && to.path !== '/login') return true;
  if (to.path === '/login' && (to.query.reason === 'session' || to.query.reason === 'profile')) return true;

  let user;
  try {
    const result = await supabase.auth.getUser();
    if (result.error && !isAuthSessionMissingError(result.error)) throw result.error;
    user = result.data.user;
  } catch {
    if (to.path === '/login') return true;
    return { path: '/login', query: { reason: 'session' } };
  }
  if (to.meta.requiresAuth && !user) return '/login';

  if (to.meta.requiresAdmin) {
    if (!user) return '/login';
    try {
      if ((await destinationForUser(user.id)) !== '/admin') return '/tourists';
    } catch {
      return { path: '/login', query: { reason: 'profile' } };
    }
  }

  if (user && to.path === '/login') {
    try {
      return await destinationForUser(user.id);
    } catch {
      return { path: '/login', query: { reason: 'profile' } };
    }
  }
  return true;
});

export default router;
