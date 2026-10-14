<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><ion-back-button default-href="/tourists" /></ion-buttons><ion-title>Destination details</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <div class="page-shell" v-if="spot">
        <img v-if="spot.image_url" class="cover" style="height:250px;border-radius:16px" :src="spot.image_url" :alt="spot.name" />
        <div v-else class="cover placeholder" style="height:250px;border-radius:16px">🌿</div>
        <h1 style="color:#19563a">{{ spot.name }}</h1>
        <p class="muted">{{ spot.category }} · 📍 {{ spot.address }}</p>
        <p style="white-space:pre-wrap;line-height:1.65">{{ spot.description }}</p>
        <div v-if="spot.entrance_fee || spot.opening_hours || spot.best_time_to_visit" class="subpanel">
          <p v-if="spot.entrance_fee"><strong>Entrance fee:</strong> {{ spot.entrance_fee }}</p>
          <p v-if="spot.opening_hours"><strong>Opening hours:</strong> {{ spot.opening_hours }}</p>
          <p v-if="spot.best_time_to_visit"><strong>Best time to visit:</strong> {{ spot.best_time_to_visit }}</p>
        </div>
        <div class="row-actions">
          <ion-button @click="openMaps(mapsDirections(spot))">Get directions</ion-button>
          <ion-button fill="outline" @click="openMaps(mapsSearch(spot))">View on Google Maps</ion-button>
        </div>
        <WeatherCard :key="spot.id" :spot-name="spot.name" :latitude="spot.latitude" :longitude="spot.longitude" />
        <h2 class="section-heading">✅ Bucket list / Things to do</h2>
        <ion-list v-if="spot.bucket_list.length">
          <ion-item v-for="(activity, i) in spot.bucket_list" :key="i">{{ i+1 }}. {{ activity }}</ion-item>
        </ion-list>
        <p v-else class="muted">No suggested activities listed yet.</p>
        <h2 class="section-heading">🍲 Nearby carinderias & sari-sari stores</h2>
        <ion-card v-for="place in nearby" :key="place.id" class="place-card" style="margin-bottom:12px">
          <ion-card-header><ion-card-subtitle>{{ place.kind }}</ion-card-subtitle><ion-card-title>{{ place.name }}</ion-card-title></ion-card-header>
          <ion-card-content>
            <p>📍 {{ place.address }}</p>
            <ion-button size="small" fill="outline" @click="openMaps(mapsDirections(place))">Directions</ion-button>
          </ion-card-content>
        </ion-card>
        <p v-if="!nearby.length" class="muted">No nearby establishments added yet.</p>
      </div>
      <div v-else class="page-shell"><p v-if="busy">Loading destination...</p><p v-else class="feedback error">{{ message || 'Destination not found.' }}</p></div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { onIonViewWillEnter, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonButton, IonList, IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent } from '@ionic/vue';
import { supabase } from '../lib/supabase';
import type { TouristSpot, NearbyPlace } from '../lib/types';
import { mapsDirections, mapsSearch, openMaps } from '../lib/types';
import { errorMessage } from '../lib/errors';
import WeatherCard from '../components/WeatherCard.vue';
const route = useRoute(); const spot = ref<TouristSpot | null>(null); const nearby = ref<NearbyPlace[]>([]); const busy = ref(false); const message = ref('');
let loadRequest = 0;
async function load() {
  const request = ++loadRequest;
  busy.value = true; message.value = ''; spot.value = null; nearby.value = [];
  try {
    const id = String(route.params.id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('This destination link is invalid.');
    const [spotResult, nearbyResult] = await Promise.all([
      supabase.from('tourist_spots').select('*').eq('id', id).maybeSingle(),
      supabase.from('nearby_places').select('*').eq('spot_id', id).order('name'),
    ]);
    if (spotResult.error) throw spotResult.error;
    if (nearbyResult.error) throw nearbyResult.error;
    if (request !== loadRequest) return;
    spot.value = spotResult.data as TouristSpot | null;
    nearby.value = (nearbyResult.data ?? []) as NearbyPlace[];
  } catch (e) { if (request === loadRequest) message.value = errorMessage(e, 'Could not load details.'); }
  finally { if (request === loadRequest) busy.value = false; }
}
onIonViewWillEnter(load);
</script>
