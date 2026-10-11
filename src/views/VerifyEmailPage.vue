<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Verify your email</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <div class="page-shell" style="max-width:480px">
        <div class="hero"><h1>Check your inbox 📩</h1><p>Enter the one-time code sent to your email address.</p></div>
        <form @submit.prevent="verify" class="stack">
          <div><div class="field-label">Email address</div><ion-input v-model="email" class="field-input" type="email" required /></div>
          <div><div class="field-label">Verification code</div><ion-input v-model="token" class="field-input" type="text" inputmode="numeric" autocomplete="one-time-code" required placeholder="Code from email" /></div>
          <p v-if="message" class="feedback" :class="{error: errorState}">{{ message }}</p>
          <ion-button type="submit" expand="block" :disabled="busy">{{ busy ? 'Checking...' : 'Verify & continue' }}</ion-button>
        </form>
        <ion-button fill="clear" expand="block" :disabled="busy" @click="resend">Resend code</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton } from '@ionic/vue';
import { supabase } from '../lib/supabase';
import { destinationForUser } from '../lib/auth';
const router = useRouter(); const route = useRoute();
const email = ref(typeof route.query.email === 'string' ? route.query.email : '');
const token = ref(''); const busy = ref(false); const message = ref(''); const errorState = ref(false);
async function verify() {
  busy.value = true; message.value = '';
  try {
    const { data, error } = await supabase.auth.verifyOtp({ email: email.value.trim(), token: token.value.trim(), type: 'email' });
    if (error) throw error;
    if (!data.user) throw new Error('Verification succeeded but no user was returned.');
    await router.replace(await destinationForUser(data.user.id));
  } catch (e) { errorState.value = true; message.value = e instanceof Error ? e.message : 'Verification failed.'; }
  finally { busy.value = false; }
}
async function resend() {
  if (!email.value.trim()) { errorState.value = true; message.value = 'Enter your email first.'; return; }
  busy.value = true;
  try {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.value.trim() });
    if (error) throw error;
    errorState.value = false; message.value = 'A new code has been requested. Check your inbox/spam folder.';
  } catch (e) { errorState.value = true; message.value = e instanceof Error ? e.message : 'Could not resend.'; }
  finally { busy.value = false; }
}
</script>
