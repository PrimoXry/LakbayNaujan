<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="callback-shell">
        <ion-spinner v-if="loading" name="crescent" color="success" />
        <h2>{{ loading ? 'Signing you in…' : 'Sign-in issue' }}</h2>
        <p v-if="message" role="alert">{{ message }}</p>
        <ion-button v-if="!loading" router-link="/login" color="success">
          Back to login
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonSpinner, IonButton } from '@ionic/vue';
import { supabase } from '../lib/supabase';
import { destinationForUser } from '../lib/auth';

const router = useRouter();
const loading = ref(true);
const message = ref('');

onMounted(async () => {
  try {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const oauthError = query.get('error_description') || hash.get('error_description');
    if (oauthError) throw new Error(oauthError);

    // supabase-js (detectSessionInUrl: true) processes the OAuth URL on init.
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) throw new Error('No sign-in session found. Check the OAuth redirect URL in Supabase.');

    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Google sign-in did not return a user.');

    await router.replace(await destinationForUser(data.user.id));
  } catch (err) {
    message.value = err instanceof Error ? err.message : 'Could not complete Google sign-in.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.callback-shell { min-height: 65vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; text-align: center; }
h2 { color: #175c3c; }
p { color: #b3261e; max-width: 420px; }
</style>
