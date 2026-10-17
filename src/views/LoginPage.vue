<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar><ion-title>🌿 LakbayNaujan</ion-title></ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="page-shell auth-page">
        <div class="hero">
          <h1>Welcome back!</h1>
          <p>Log in to explore Naujan, Oriental Mindoro.</p>
        </div>

        <form class="stack" @submit.prevent="login">
          <div>
            <label class="field-label" for="login-email">Email address</label>
            <ion-input id="login-email" v-model="email" class="field-input" type="email"
              autocomplete="email" required placeholder="you@gmail.com" />
          </div>
          <div>
            <label class="field-label" for="login-password">Password</label>
            <ion-input id="login-password" v-model="password" class="field-input" type="password"
              autocomplete="current-password" required placeholder="Enter password" />
          </div>

          <p v-if="message" class="feedback error" role="alert">{{ message }}</p>
          <p v-else-if="route.query.reason === 'session'" class="feedback error" role="alert">We could not check your session. Please try logging in again.</p>
          <p v-else-if="route.query.reason === 'profile'" class="feedback error" role="alert">We could not load your account permissions. Please try again or contact support.</p>
          <p v-if="needsVerification"><router-link :to="{ path: '/verify', query: { email: normalizeEmail(email) } }">Verify email / request another code</router-link></p>
          <ion-button type="submit" color="success" expand="block" :disabled="busy">
            {{ busy ? 'Signing in…' : 'Log in' }}
          </ion-button>
        </form>

        <div class="or-divider"><span>OR</span></div>
        <ion-button expand="block" color="light" class="google-button" :disabled="busy" @click="signInWithGoogle">
          <span class="google-g" aria-hidden="true">G</span>
          Continue with Google
        </ion-button>
        <p class="muted auth-footer">Don't have an account? <router-link to="/signup">Sign up</router-link></p>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton } from '@ionic/vue';
import { supabase } from '../lib/supabase';
import { destinationForUser } from '../lib/auth';
import { errorCode, errorMessage } from '../lib/errors';
import { isValidEmail, normalizeEmail } from '../lib/verification';

const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const busy = ref(false);
const message = ref('');
const needsVerification = ref(false);

async function login() {
  if (busy.value) return;
  if (!isValidEmail(email.value) || !password.value) {
    message.value = 'Enter a valid email address and your password.';
    return;
  }
  busy.value = true;
  message.value = '';
  needsVerification.value = false;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email.value),
      password: password.value,
    });
    if (error) throw error;
    if (!data.user) throw new Error('Login did not return a user.');
    await router.replace(await destinationForUser(data.user.id));
  } catch (err) {
    needsVerification.value = errorCode(err) === 'email_not_confirmed';
    message.value = errorMessage(err, 'Unable to log in.');
  } finally {
    busy.value = false;
  }
}

async function signInWithGoogle() {
  if (busy.value) return;
  busy.value = true;
  message.value = '';
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Browser / ionic serve only; Android APK requires native redirect handling.
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    // Browser navigates to Google on success.
  } catch (err) {
    message.value = errorMessage(err, 'Could not start Google login.');
    busy.value = false;
  }
}
</script>

<style scoped>
.auth-page { max-width: 480px; padding-top: 22px; }
.or-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: #758779; font-size: 12px; }
.or-divider::before, .or-divider::after { content: ''; flex: 1; height: 1px; background: #dae5dc; }
.google-button { --border-radius: 12px; --color: #273b2d; --box-shadow: none; height: 48px; text-transform: none; }
.google-g { font-size: 20px; color: #4285f4; font-weight: 900; margin-right: 12px; }
.auth-footer { text-align: center; margin-top: 22px; }
.auth-footer a { color: var(--app-accent); font-weight: 700; }
</style>
