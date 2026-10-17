<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar><ion-title>🌿 Create an account</ion-title></ion-toolbar>
    </ion-header>

    <ion-content>
      <main class="page-shell auth-page">
        <div class="hero">
          <h1>Join LakbayNaujan!</h1>
          <p>Create an account to discover Naujan's destinations.</p>
        </div>
        <form class="stack" @submit.prevent="signup">
          <div>
            <label class="field-label" for="signup-username">Username</label>
            <ion-input id="signup-username" v-model="username" class="field-input" autocomplete="username"
              required placeholder="3–30 letters, numbers or underscores" />
          </div>
          <div>
            <label class="field-label" for="signup-email">Email address</label>
            <ion-input id="signup-email" v-model="email" class="field-input" type="email" autocomplete="email"
              required placeholder="you@gmail.com" />
          </div>
          <div>
            <label class="field-label" for="signup-password">Password</label>
            <ion-input id="signup-password" v-model="password" class="field-input" type="password"
              autocomplete="new-password" required placeholder="At least 8 characters" />
          </div>
          <div>
            <label class="field-label" for="signup-confirm">Confirm password</label>
            <ion-input id="signup-confirm" v-model="confirmPassword" class="field-input" type="password"
              autocomplete="new-password" required placeholder="Repeat password" />
          </div>
          <p v-if="message" class="feedback error" role="alert">{{ message }}</p>
          <ion-button color="success" expand="block" type="submit" :disabled="busy">
            {{ busy ? 'Creating account…' : 'Sign up' }}
          </ion-button>
        </form>

        <div class="or-divider"><span>OR</span></div>
        <ion-button expand="block" color="light" class="google-button" :disabled="busy" @click="signInWithGoogle">
          <span class="google-g" aria-hidden="true">G</span>
          Continue with Google
        </ion-button>
        <p class="muted auth-footer">Already have an account? <router-link to="/login">Log in</router-link></p>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton } from '@ionic/vue';
import { supabase } from '../lib/supabase';
import { destinationForUser } from '../lib/auth';
import { errorMessage, logRequestError } from '../lib/errors';
import { isValidEmail, markEmailRequested, normalizeEmail } from '../lib/verification';

const router = useRouter();
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const busy = ref(false);
const message = ref('');

async function signup() {
  if (busy.value) return;
  message.value = '';
  const cleanUsername = username.value.trim();
  const cleanEmail = normalizeEmail(email.value);
  if (!isValidEmail(cleanEmail)) {
    message.value = 'Enter a valid email address.';
    return;
  }
  if (!/^[A-Za-z0-9_]{3,30}$/.test(cleanUsername)) {
    message.value = 'Username must be 3–30 letters, numbers or underscores.';
    return;
  }
  if (password.value.length < 8) {
    message.value = 'Password must contain at least 8 characters.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    message.value = 'Passwords do not match.';
    return;
  }

  busy.value = true;
  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password.value,
      options: {
        data: { username: cleanUsername },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Sign-up did not return an account. Please try again.');
    // Email confirmation ON -> no session yet; ask for emailed code.
    // Email confirmation OFF -> session returned and user can continue directly.
    if (data.session && data.user) {
      await router.replace(await destinationForUser(data.user.id));
    } else {
      // Acceptance is not proof of delivery; existing accounts may get a generic response.
      markEmailRequested(cleanEmail);
      await router.replace({ path: '/verify', query: { email: cleanEmail } });
    }
  } catch (err) {
    logRequestError('signup', err);
    message.value = errorMessage(err, 'Sign-up failed.');
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
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    // Google handles first-time registration and returning sign-in.
  } catch (err) {
    message.value = errorMessage(err, 'Could not start Google sign-in.');
    busy.value = false;
  }
}
</script>

<style scoped>

.auth-page { max-width: 480px; padding-top: 22px; }
.or-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: #758779; font-size: 12px; }
.or-divider::before, .or-divider::after { content: ''; flex: 1; height: 1px; background: #dae5dc; }
.google-button { --border-radius: 12px; --color: #273b2d; --box-shadow: none; height: 48px; text-transform: none; }
.field-input { --padding-start: 12px; --padding-end: 12px; --padding-top: 10px; --padding-bottom: 10px; color: #000000; font-size: 14px; border-radius: 12px; background: #f5f9f6; }
.google-g { font-size: 20px; color: #4285f4; font-weight: 900; margin-right: 12px; }
.auth-footer { text-align: center; margin-top: 22px; }
.auth-footer a { color: #176b45; font-weight: 700; }
</style>
