<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>🛠️ LakbayNaujan Admin</ion-title>
        <ion-buttons slot="end"><ion-button :disabled="busy" @click="logout">Logout</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page-shell">
        <div class="hero"><small>ADMINISTRATOR · EXCLUSIVE ACCESS</small><h1>Tourism Management</h1><p>Add, edit or remove destinations, photos, activities and nearby businesses.</p></div>
        <div class="subpanel">
          <div class="row-actions" style="justify-content:space-between">
            <strong>Tourist spots: {{ spots.length }}</strong>
            <ion-button :disabled="busy" @click="startNew">{{ editing ? 'Cancel edit / New spot' : 'Add tourist spot' }}</ion-button>
          </div>
          <p v-if="message" class="feedback" :class="{error: errorState}">{{ message }}</p>
          <div v-for="spot in spots" :key="spot.id" class="row-actions" style="justify-content:space-between;border-bottom:1px solid #e7eee7;padding:10px 0">
            <div style="min-width:160px;flex:1"><strong>{{ spot.name }}</strong><div class="muted">{{ spot.address }}</div><small class="muted">{{ spotImages(spot).length }} saved {{ spotImages(spot).length === 1 ? 'photo' : 'photos' }}</small></div>
            <ion-button size="small" fill="outline" :disabled="busy" @click="editSpot(spot)">Edit</ion-button>
            <ion-button size="small" fill="outline" color="danger" :disabled="busy" @click="deleteSpot(spot)">Delete</ion-button>
          </div>
        </div>

        <h2 class="section-heading">{{ editing ? 'Edit tourist spot' : 'Add new tourist spot' }}</h2>
        <form @submit.prevent="save" class="stack">
          <div><div class="field-label">Tourist spot name *</div><ion-input v-model="form.name" class="field-input" required placeholder="Naujan Lake" /></div>
          <div><div class="field-label">Category *</div><ion-input v-model="form.category" class="field-input" required placeholder="Lake, Nature, Heritage..." /></div>
          <div><div class="field-label">Full description *</div><ion-textarea v-model="form.description" class="field-input" auto-grow :rows="4" required placeholder="History, highlights, travel tips..." /></div>
          <div><div class="field-label">Address / Barangay *</div><ion-input v-model="form.address" class="field-input" required placeholder="Naujan, Oriental Mindoro" /></div>
          <div class="card-grid">
            <div><div class="field-label">Google Maps latitude (optional)</div><ion-input v-model="form.latitude" class="field-input" type="number" step="any" min="-90" max="90" placeholder="13.3..." /></div>
            <div><div class="field-label">Google Maps longitude (optional)</div><ion-input v-model="form.longitude" class="field-input" type="number" step="any" min="-180" max="180" placeholder="121.3..." /></div>
          </div>
          <p class="muted" style="font-size:13px;margin:0">For a precise map pin, copy the latitude and longitude of the destination from Google Maps. Otherwise, directions will search using its name and address.</p>
          <div class="row-actions"><ion-button type="button" fill="outline" size="small" @click="previewMap">Preview Google Maps location</ion-button></div>
          <div class="card-grid">
            <div><div class="field-label">Entrance fee</div><ion-input v-model="form.entrance_fee" class="field-input" placeholder="Free / ₱50 / Ask on-site" /></div>
            <div><div class="field-label">Opening hours</div><ion-input v-model="form.opening_hours" class="field-input" placeholder="8:00 AM–5:00 PM" /></div>
          </div>
          <div><div class="field-label">Best time to visit</div><ion-input v-model="form.best_time_to_visit" class="field-input" placeholder="Morning / November–April" /></div>
          <div class="subpanel">
            <label for="spot-photos" class="field-label">Tourist photos ({{ photos.length }}/{{ MAX_SPOT_PHOTOS }})</label>
            <p class="muted">JPEG, PNG or WebP, up to 5 MB each. The first photo is the cover. Swipe through all photos on the destination cards and details.</p>
            <input id="spot-photos" type="file" multiple accept="image/jpeg,image/png,image/webp" :disabled="busy" @change="pickImages" />
            <p v-if="photos.some(photo => photo.file)" class="muted">New pictures are selected. Click Save changes or Publish tourist spot to save them to the destination.</p>
            <div v-if="photos.length" class="photo-drafts">
              <div v-for="(photo, index) in photos" :key="photo.preview" class="photo-draft">
                <img :src="photo.preview" :alt="`Destination photo ${index + 1}`" />
                <p>{{ index === 0 ? 'Cover photo' : `Photo ${index + 1}` }} <span v-if="photo.file">· {{ photo.file.name }}</span></p>
                <div class="row-actions">
                  <button type="button" :disabled="busy || index === 0" :aria-label="`Move photo ${index + 1} earlier`" @click="movePhoto(index, -1)">←</button>
                  <button type="button" :disabled="busy || index === photos.length - 1" :aria-label="`Move photo ${index + 1} later`" @click="movePhoto(index, 1)">→</button>
                  <button type="button" :disabled="busy" :aria-label="`Remove photo ${index + 1}`" @click="removePhoto(index)">Remove</button>
                </div>
              </div>
            </div>
          </div>
          <div class="subpanel">
            <div class="field-label">✅ Bucket list / Things to do (one activity per line)</div>
            <ion-textarea v-model="form.bucketListText" class="field-input" auto-grow :rows="4" placeholder="Take landscape photos&#10;Explore the lake&#10;Try local food" />
          </div>
          <h2 class="section-heading">🍲 Nearby carinderias / sari-sari stores</h2>
          <p class="muted">Enter establishments you have verified are near this attraction. Each can have its own Google Maps location.</p>
          <div v-for="(place, index) in nearbyDrafts" :key="index" class="subpanel stack">
            <div class="row-actions" style="justify-content:space-between"><strong>Nearby place {{ index + 1 }}</strong><ion-button size="small" fill="clear" color="danger" @click="nearbyDrafts.splice(index, 1)">Remove</ion-button></div>
            <div><div class="field-label">Establishment name *</div><ion-input v-model="place.name" class="field-input" placeholder="Store or carinderia name" /></div>
            <div><div class="field-label">Type</div>
              <ion-select v-model="place.kind" interface="popover" class="field-input">
                <ion-select-option value="Carinderia">Carinderia</ion-select-option>
                <ion-select-option value="Sari-sari Store">Sari-sari Store</ion-select-option>
                <ion-select-option value="Other">Other</ion-select-option>
              </ion-select>
            </div>
            <div><div class="field-label">Address / Barangay *</div><ion-input v-model="place.address" class="field-input" placeholder="Address in Naujan" /></div>
            <div class="card-grid">
              <div><div class="field-label">Latitude</div><ion-input v-model="place.lat" class="field-input" type="number" step="any" min="-90" max="90" placeholder="Optional" /></div>
              <div><div class="field-label">Longitude</div><ion-input v-model="place.lon" class="field-input" type="number" step="any" min="-180" max="180" placeholder="Optional" /></div>
            </div>
          </div>
          <ion-button type="button" expand="block" fill="outline" @click="addNearby">+ Add nearby establishment</ion-button>
          <p v-if="message" class="feedback form-feedback" :class="{ error: errorState }" :role="errorState ? 'alert' : 'status'">{{ message }}</p>
          <ion-button type="submit" expand="block" :disabled="busy">{{ busy ? 'Saving...' : editing ? 'Save changes' : 'Publish tourist spot' }}</ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { onIonViewWillEnter, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonInput, IonTextarea, IonSelect, IonSelectOption } from '@ionic/vue';
import { supabase } from '../lib/supabase';
import type { TouristSpot, NearbyPlace } from '../lib/types';
import { mapsSearch, openMaps } from '../lib/types';
import { errorCode, errorMessage } from '../lib/errors';
import { MAX_SPOT_PHOTOS, spotImages, uploadSpotPhotos, validateSpotPhotos, type SpotPhotoDraft } from '../lib/spotPhotos';

const router = useRouter();
const spots = ref<TouristSpot[]>([]); const editing = ref(false); const busy = ref(false);
const photos = ref<SpotPhotoDraft[]>([]); const message = ref(''); const errorState = ref(false);
const form = reactive({ id: '', name: '', category: 'Nature', description: '', address: '', latitude: '', longitude: '',
  entrance_fee: '', opening_hours: '', best_time_to_visit: '', bucketListText: '' });
type StoreDraft = { name: string; kind: 'Carinderia' | 'Sari-sari Store' | 'Other'; address: string; lat: string; lon: string };
const nearbyDrafts = ref<StoreDraft[]>([]);

function coord(value: unknown, max: number): number | null {
  const stringValue = String(value ?? '').trim();
  if (!stringValue) return null;
  const parsed = Number(stringValue);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > max) throw new Error(`Invalid coordinate: ${stringValue}`);
  return parsed;
}
function addNearby() { nearbyDrafts.value.push({ name: '', kind: 'Carinderia', address: '', lat: '', lon: '' }); }
function startNew() {
  editing.value = false; resetPhotos(); nearbyDrafts.value = []; message.value = '';
  Object.assign(form, { id: '', name: '', category: 'Nature', description: '', address: '', latitude: '', longitude: '',
    entrance_fee: '', opening_hours: '', best_time_to_visit: '', bucketListText: '' });
}
function previewMap() {
  try {
    openMaps(mapsSearch({ name: form.name, address: form.address, latitude: coord(form.latitude, 90), longitude: coord(form.longitude, 180) }));
  } catch (e) { showError(e); }
}
function resetPhotos(urls: string[] = []) {
  for (const photo of photos.value) if (photo.file) URL.revokeObjectURL(photo.preview);
  photos.value = urls.map(preview => ({ preview }));
}
function pickImages(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (busy.value || !files.length) return;
  try {
    validateSpotPhotos(files, photos.value.length);
    photos.value.push(...files.map(file => ({ file, preview: URL.createObjectURL(file) })));
    message.value = '';
  } catch (e) { showError(e); }
  finally { input.value = ''; }
}
function removePhoto(index: number) {
  if (busy.value) return;
  const [photo] = photos.value.splice(index, 1);
  if (photo?.file) URL.revokeObjectURL(photo.preview);
}
function movePhoto(index: number, direction: number) {
  if (busy.value) return;
  const target = index + direction;
  if (target < 0 || target >= photos.value.length) return;
  [photos.value[index], photos.value[target]] = [photos.value[target], photos.value[index]];
}
function showError(e: unknown) { errorState.value = true; message.value = errorMessage(e, 'Something went wrong.'); }
async function loadSpots() {
  const { data, error } = await supabase.from('tourist_spots').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  spots.value = (data ?? []) as TouristSpot[];
}
async function editSpot(spot: TouristSpot) {
  if (busy.value) return;
  busy.value = true; message.value = '';
  try {
    const { data, error } = await supabase.from('nearby_places').select('*').eq('spot_id', spot.id).order('name');
    if (error) throw error;
    // Only replace the editable form after the related records have loaded.
    editing.value = true; resetPhotos(spotImages(spot));
    Object.assign(form, { id: spot.id, name: spot.name, category: spot.category, description: spot.description,
      address: spot.address, latitude: spot.latitude === null ? '' : String(spot.latitude),
      longitude: spot.longitude === null ? '' : String(spot.longitude),
      entrance_fee: spot.entrance_fee ?? '', opening_hours: spot.opening_hours ?? '',
      best_time_to_visit: spot.best_time_to_visit ?? '',
      bucketListText: spot.bucket_list.join('\n') });
    nearbyDrafts.value = ((data ?? []) as NearbyPlace[]).map(p => ({ name: p.name, kind: p.kind,
      address: p.address, lat: p.latitude === null ? '' : String(p.latitude),
      lon: p.longitude === null ? '' : String(p.longitude) }));
  } catch (e) { showError(e); }
  finally { busy.value = false; }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function save() {
  if (busy.value) return;
  message.value = ''; busy.value = true;
  let partialSaveMessage = '';
  try {
    const editingId = editing.value ? form.id : null;
    if (!form.name.trim() || !form.description.trim() || !form.address.trim()) throw new Error('Complete the required fields.');
    const latitude = coord(form.latitude, 90); const longitude = coord(form.longitude, 180);
    if ((latitude === null) !== (longitude === null)) throw new Error('Enter both latitude and longitude, or leave both blank.');
    const normalizedStores = nearbyDrafts.value.map(p => {
      if (!p.name.trim() || !p.address.trim()) throw new Error('Each nearby establishment needs a name and address.');
      const lat = coord(p.lat, 90); const lon = coord(p.lon, 180);
      if ((lat === null) !== (lon === null)) throw new Error('Nearby establishment coordinates must be a pair.');
      return { name: p.name.trim(), kind: p.kind, address: p.address.trim(), latitude: lat, longitude: lon };
    });
    const payload = { name: form.name.trim(), category: form.category.trim() || 'Nature',
      description: form.description.trim(), address: form.address.trim(), latitude, longitude,
      entrance_fee: form.entrance_fee.trim() || null, opening_hours: form.opening_hours.trim() || null,
      best_time_to_visit: form.best_time_to_visit.trim() || null,
      bucket_list: form.bucketListText.split('\n').map(s => s.trim()).filter(Boolean) };
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Please log in again.');
    const imageUrls = await uploadSpotPhotos(photos.value);
    const spotPayload = { ...payload, image_urls: imageUrls, image_url: imageUrls[0] ?? null };
    let spotId: string;
    if (editingId) {
      const { data, error } = await supabase.from('tourist_spots').update(spotPayload).eq('id', editingId).select('id').single();
      if (error) throw error;
      spotId = data.id;
    } else {
      const { data, error } = await supabase.from('tourist_spots').insert({ ...spotPayload, created_by: user.id }).select('id').single();
      if (error) throw error;
      spotId = data.id;
    }
    // A retry must update the row already created, rather than inserting a duplicate.
    editing.value = true; form.id = spotId; resetPhotos(imageUrls);
    partialSaveMessage = 'The destination was saved, but nearby places could not be fully updated. Keep this form open and retry. ';
    // MVP synchronization: delete old nearby entries, then insert the new list.
    // If the second request fails, the spot may be saved without all stores; retry the edit.
    const { error: deleteError } = await supabase.from('nearby_places').delete().eq('spot_id', spotId);
    if (deleteError) throw deleteError;
    if (normalizedStores.length) {
      const { error: storeError } = await supabase.from('nearby_places').insert(normalizedStores.map(p => ({ ...p, spot_id: spotId })));
      if (storeError) throw storeError;
    }
    partialSaveMessage = 'The destination was saved, but the list could not be refreshed. ';
    startNew();
    await loadSpots();
    errorState.value = false; message.value = 'Tourist spot saved successfully.';
  } catch (e) {
    showError(e);
    if (['PGRST204', '42703'].includes(errorCode(e))) {
      message.value = 'Photo gallery setup is incomplete. Run the tourist spot gallery migration in Supabase SQL Editor, then retry.';
    }
    message.value = partialSaveMessage + message.value;
  }
  finally { busy.value = false; }
}
async function deleteSpot(spot: TouristSpot) {
  if (busy.value) return;
  if (!window.confirm(`Delete ${spot.name} and all its nearby establishment records?`)) return;
  busy.value = true; message.value = '';
  try {
    const { data, error } = await supabase.from('tourist_spots').delete().eq('id', spot.id).select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('No destination was deleted. It may already be gone, or your permissions have changed.');
    if (editing.value && form.id === spot.id) startNew();
    await loadSpots(); errorState.value = false; message.value = 'Destination deleted.';
  } catch (e) { showError(e); }
  finally { busy.value = false; }
}
async function logout() {
  if (busy.value) return;
  busy.value = true; message.value = '';
  try {
    const { error } = await supabase.auth.signOut();
    spots.value = []; startNew();
    if (error) throw error;
    await router.replace('/login');
  } catch (e) { showError(e); }
  finally { busy.value = false; }
}
onIonViewWillEnter(async () => {
  if (busy.value) return;
  busy.value = true; message.value = ''; spots.value = [];
  try { await loadSpots(); } catch (e) { showError(e); }
  finally { busy.value = false; }
});
onBeforeUnmount(() => resetPhotos());
</script>

<style scoped>
.photo-drafts { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-top: 16px; }
.photo-draft { min-width: 0; padding: 10px; border: 1px solid var(--app-border); border-radius: 12px; }
.photo-draft img { width: 100%; height: 130px; object-fit: cover; border-radius: 8px; }
.photo-draft p { font-size: 13px; overflow-wrap: anywhere; }
.photo-draft button { padding: 8px 10px; border: 1px solid var(--app-border); border-radius: 8px; background: var(--app-surface); color: var(--app-heading); cursor: pointer; }
.photo-draft button:disabled { opacity: .4; cursor: default; }
</style>
