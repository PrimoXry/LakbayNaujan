<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Create account</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <div class="page-shell" style="max-width:480px">
        <div class="hero"><h1>Join LakbayNaujan</h1><p>Create your visitor account.</p></div>
        <form @submit.prevent="signup" class="stack">
          <div><div class="field-label">Username</div><ion-input v-model="username" class="field-input" autocomplete="username" required placeholder="e.g. juan123" /></div>
          <div><div class="field-label">Email (Gmail is okay)</div><ion-input v-model="email" class="field-input" type="email" autocomplete="email" required placeholder="you@gmail.com" /></div>
          <div><div class="field-label">Password</div><ion-input v-model="password" class="field-input" type="password" autocomplete="new-password" required placeholder="At least 8 characters" /></div>
          <div><div class="field-label">Confirm password</div><ion-input v-model="confirmPassword" class="field-input" type="password" autocomplete="new-password" required placeholder="Repeat password" /></div>
          <p v-if="message" class="feedback error">{{ message }}</p>
          <ion-button type="submit" expand="block" :disabled="busy">{{ busy ? 'Creating account...' : 'Sign up & send email code' }}</ion-button>
        </form>
        <p class="muted">Already registered? <router-link to="/login">Login</router-link></p>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton } from '@ionic/vue';
import { supabase } from '../lib/supabase';
const router = useRouter();
const username = ref(''); const email = ref(''); const password = ref(''); const confirmPassword = ref('');
const busy = ref(false); const message = ref('');
async function signup() {
  message.value = '';
  if (!/^[A-Za-z0-9_]{3,30}$/.test(username.value.trim())) { message.value = 'Username: 3–30 letters, digits or underscores.'; return; }
  if (password.value.length < 8) { message.value = 'Password must contain at least 8 characters.'; return; }
  if (password.value !== confirmPassword.value) { message.value = 'Passwords do not match.'; return; }
  busy.value = true;
  try {
    const { error } = await supabase.auth.signUp({ email: email.value.trim().toLowerCase(), password: password.value,
      options: { data: { username: username.value.trim() } } });
    if (error) throw error;
    await router.push({ path: '/verify', query: { email: email.value.trim().toLowerCase() } });
  } catch (e) { message.value = e instanceof Error ? e.message : 'Sign-up failed.'; }
  finally { busy.value = false; }
}
</script>
