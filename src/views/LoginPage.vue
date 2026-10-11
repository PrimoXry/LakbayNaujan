<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>🌿 LakbayNaujan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <main class="login-shell">
        <div class="logo" aria-hidden="true">🌿</div>
        <h1>Welcome to LakbayNaujan</h1>
        <p class="subtitle">Discover destinations, activities and local favorites in Naujan, Oriental Mindoro.</p>

        <ion-button
          color="light"
          expand="block"
          class="google-button"
          :disabled="busy"
          @click="signInWithGoogle"
        >
          <span class="google-g" aria-hidden="true">G</span>
          {{ busy ? 'Connecting to Google...' : 'Continue with Google' }}
        </ion-button>

        <p v-if="message" class="error" role="alert">{{ message }}</p>
        <p class="hint">One button for new and returning visitors. Admin accounts use this same button.</p>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue';
import { supabase } from '../lib/supabase';

const busy = ref(false);
const message = ref('');

async function signInWithGoogle() {
  if (busy.value) return;
  busy.value = true;
  message.value = '';
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Browser development (ionic serve). Android APK requires deep links.
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    // Browser redirects to Google; no need to navigate here.
  } catch (err) {
    message.value = err instanceof Error ? err.message : 'Google sign-in could not start.';
    busy.value = false;
  }
}
</script>

<style scoped>
ion-toolbar { --background: #ffffff; --color: #176b45; }
ion-content { --background: #f4f8f3; }
.login-shell {
  max-width: 470px; margin: 0 auto; min-height: 80%; padding: 70px 24px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  justify-content: center;
}
.logo { font-size: 64px; margin-bottom: 4px; }
h1 { font-weight: 800; font-size: 30px; color: #174c35; line-height: 1.2; margin: 14px 0; }
.subtitle { color: #5e7766; line-height: 1.6; margin: 0 0 32px; }
.google-button { width: 100%; font-weight: 700; --border-radius: 13px; --color: #243629; --box-shadow: 0 3px 12px #193a2617; height: 52px; }
.google-g { font-size: 23px; font-weight: 900; color: #4285f4; margin-right: 14px; }
.hint { color: #667b6d; font-size: 12px; line-height: 1.5; margin-top: 20px; }
.error { margin-top: 20px; color: #c62828; font-size: 14px; }
</style>
