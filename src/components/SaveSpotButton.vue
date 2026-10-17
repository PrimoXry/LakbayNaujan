<template>
  <div>
    <ion-button fill="outline" :disabled="loading || saving || !ready" :aria-pressed="saved" @click="toggle"><ion-icon slot="start" :icon="saved ? bookmark : bookmarkOutline" aria-hidden="true" />{{ saving ? 'Saving…' : saved ? 'Saved spot' : 'Save spot' }}</ion-button>
    <p v-if="message" class="feedback error" role="status">{{ message }} <button v-if="!ready" type="button" class="retry-save" @click="load">Retry</button></p>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { IonButton, IonIcon } from '@ionic/vue';
import { bookmark, bookmarkOutline } from 'ionicons/icons';
import { supabase } from '../lib/supabase';
import { accountError, loadSavedSpots, setSpotSaved } from '../lib/userAccount';
const props = defineProps<{ spotId: string }>();
const saved = ref(false); const loading = ref(false); const saving = ref(false); const ready = ref(false); const message = ref('');
let userId = ''; let requestId = 0;
async function load() {
  const request = ++requestId; const spotId = props.spotId;
  loading.value = true; saving.value = false; ready.value = false; saved.value = false; message.value = ''; userId = '';
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Please log in to save spots.');
    const ids = await loadSavedSpots(data.user.id);
    if (request === requestId) { userId = data.user.id; saved.value = ids.includes(spotId); ready.value = true; }
  } catch (error) { if (request === requestId) message.value = accountError(error, 'Could not load saved spots.'); }
  finally { if (request === requestId) loading.value = false; }
}
async function toggle() {
  if (!ready.value || saving.value) return;
  const request = requestId; const next = !saved.value;
  saving.value = true; message.value = '';
  try { await setSpotSaved(userId, props.spotId, next); if (request === requestId) saved.value = next; }
  catch (error) { if (request === requestId) message.value = accountError(error, 'Could not update your saved spots.'); }
  finally { if (request === requestId) saving.value = false; }
}
watch(() => props.spotId, load, { immediate: true });
onBeforeUnmount(() => { ++requestId; });
</script>
<style scoped>
.retry-save { background: none; border: none; color: inherit; text-decoration: underline; cursor: pointer; }
</style>
