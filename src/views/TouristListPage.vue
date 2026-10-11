<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>🌿 LakbayNaujan</ion-title><ion-buttons slot="end"><ion-button @click="logout">Logout</ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content>
      <div class="page-shell">
        <div class="hero"><small>📍 Naujan, Oriental Mindoro</small><h1>Discover Naujan</h1><p>Explore local destinations and plan what to do.</p></div>
        <ion-searchbar v-model="search" placeholder="Search tourist spots..." :debounce="150" />
        <h2 class="section-heading">Tourist destinations</h2>
        <div v-if="busy" class="muted">Loading destinations...</div>
        <p v-if="message" class="feedback error">{{ message }}</p>
        <div class="card-grid">
          <ion-card v-for="spot in filtered" :key="spot.id" class="place-card">
            <img v-if="spot.image_url" class="cover" :src="spot.image_url" :alt="spot.name" />
            <div v-else class="cover placeholder">🌿</div>
            <ion-card-header>
              <ion-card-subtitle>{{ spot.category }} · 📍 {{ spot.address }}</ion-card-subtitle>
              <ion-card-title>{{ spot.name }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ spot.description.length > 130 ? spot.description.slice(0, 130) + '…' : spot.description }}</p>
              <ion-button expand="block" @click="router.push('/tourists/' + spot.id)">View details</ion-button>
            </ion-card-content>
          </ion-card>
        </div>
        <p v-if="!busy && !filtered.length && !message" class="muted">No tourist spots found. Admin can add destinations from the dashboard.</p>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { onIonViewWillEnter, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSearchbar, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent } from '@ionic/vue';
import { supabase } from '../lib/supabase';
import type { TouristSpot } from '../lib/types';
const router = useRouter();
const search = ref(''); const spots = ref<TouristSpot[]>([]); const busy = ref(false); const message = ref('');
const filtered = computed(() => spots.value.filter(s => `${s.name} ${s.category} ${s.address}`.toLowerCase().includes(search.value.toLowerCase())));
async function load() {
  busy.value = true; message.value = '';
  try {
    const { data, error } = await supabase.from('tourist_spots').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    spots.value = (data ?? []) as TouristSpot[];
  } catch (e) { message.value = e instanceof Error ? e.message : 'Could not load destinations.'; }
  finally { busy.value = false; }
}
async function logout() { await supabase.auth.signOut(); await router.replace('/login'); }
onIonViewWillEnter(load);
</script>
