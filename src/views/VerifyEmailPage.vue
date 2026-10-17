<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Verify your email</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <div class="page-shell" style="max-width:480px">
        <div class="hero"><h1>Verify your email 📩</h1><p>Check your inbox and spam folder for a confirmation email. Enter the code when it arrives.</p></div>
        <p class="muted">No email yet? Check the address below, then request another code. If you already verified this email or registered with Google, return to login.</p>
        <form @submit.prevent="verify" class="stack">
          <div><div class="field-label">Email address</div><ion-input v-model="email" class="field-input" type="email" autocomplete="email" :disabled="busy" required /></div>
          <div><div class="field-label">Verification code</div><ion-input v-model="token" class="field-input" type="text" inputmode="numeric" autocomplete="one-time-code" :disabled="busy" required placeholder="Code from email" /></div>
          <p v-if="message" class="feedback" :class="{error: errorState}" role="status">{{ message }}</p>
          <ion-button type="submit" expand="block" :disabled="busy">{{ busy ? 'Checking...' : 'Verify & continue' }}</ion-button>
        </form>
        <ion-button fill="clear" expand="block" :disabled="busy || retrySeconds > 0" @click="resend">{{ retrySeconds > 0 ? `Resend in ${retrySeconds}s` : 'Resend code' }}</ion-button>
        <p class="muted"><router-link to="/login">Back to login</router-link></p>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { onIonViewWillEnter, onIonViewDidLeave, IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton } from '@ionic/vue';
import { destinationForUser } from '../lib/auth';
import { errorMessage, logRequestError } from '../lib/errors';
import { emailRetrySeconds, resendSignupCode, verifySignupCode } from '../lib/verification';
const router = useRouter(); const route = useRoute();
const email = ref(typeof route.query.email === 'string' ? route.query.email : '');
const token = ref(''); const busy = ref(false); const message = ref(''); const errorState = ref(false);
const clock = ref(Date.now());
const retrySeconds = computed(() => { void clock.value; return emailRetrySeconds(email.value); });
let timer: ReturnType<typeof setInterval> | undefined;
function stopTimer() { clearInterval(timer); timer = undefined; }
onIonViewWillEnter(() => {
  if (typeof route.query.email === 'string') email.value = route.query.email;
  token.value = ''; message.value = ''; errorState.value = false;
  stopTimer(); clock.value = Date.now();
  timer = setInterval(() => { clock.value = Date.now(); }, 1000);
});
onIonViewDidLeave(stopTimer);
onUnmounted(stopTimer);
watch(email, () => { token.value = ''; message.value = ''; });
async function verify() {
  if (busy.value) return;
  busy.value = true; message.value = ''; errorState.value = false;
  let verified = false;
  try {
    const userId = await verifySignupCode(email.value, token.value);
    verified = true;
    token.value = '';
    await router.replace(await destinationForUser(userId));
  } catch (e) {
    errorState.value = true;
    message.value = verified
      ? `Your email is verified, but we could not open your account. ${errorMessage(e, 'Please return to login.')}`
      : errorMessage(e, 'Verification failed.');
  }
  finally { busy.value = false; }
}
async function resend() {
  if (busy.value || emailRetrySeconds(email.value) > 0) return;
  busy.value = true; message.value = ''; errorState.value = false;
  try {
    await resendSignupCode(email.value);
    token.value = '';
    message.value = 'Request accepted. If this address has an unverified account, check your inbox and spam folder for the latest confirmation email. Already verified? Return to login.';
  } catch (e) {
    logRequestError('resend', e);
    errorState.value = true; message.value = errorMessage(e, 'Could not request another code.');
  }
  finally { clock.value = Date.now(); busy.value = false; }
}
</script>
