<template>
  <article class="destination-card">
    <div class="destination-image">
      <SpotImageSlider :name="spot.name" :image-urls="spot.image_urls" :image-url="spot.image_url" />
      <span class="destination-category">{{ spot.category }}</span>
      <button type="button" class="bookmark-button" :disabled="saving || saveDisabled" :aria-pressed="saved"
        :aria-label="`${saved ? 'Unsave' : 'Save'} ${spot.name}`" @click="$emit('toggle-save', spot)">
        <ion-icon :icon="saved ? bookmark : bookmarkOutline" aria-hidden="true" />
      </button>
    </div>
    <div class="destination-body">
      <p class="destination-address"><ion-icon :icon="locationOutline" aria-hidden="true" /> {{ spot.address }}</p>
      <h3>{{ spot.name }}</h3>
      <p class="destination-description">{{ spot.description }}</p>
      <router-link :to="'/tourists/' + spot.id" class="destination-link">View details <ion-icon :icon="arrowForwardOutline" aria-hidden="true" /></router-link>
    </div>
  </article>
</template>
<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { bookmark, bookmarkOutline, locationOutline, arrowForwardOutline } from 'ionicons/icons';
import SpotImageSlider from './SpotImageSlider.vue';
import type { TouristSpot } from '../lib/types';
defineProps<{ spot: TouristSpot; saved: boolean; saving?: boolean; saveDisabled?: boolean }>();
defineEmits<{ 'toggle-save': [spot: TouristSpot] }>();
</script>
<style scoped>
.destination-card { overflow: hidden; border-radius: 18px; background: var(--app-surface); border: 1px solid var(--app-border); box-shadow: 0 5px 18px #122d1910; }
.destination-image { height: 190px; position: relative; background: var(--app-soft); }
.destination-category { position: absolute; left: 12px; top: 12px; max-width: calc(100% - 72px); padding: 6px 12px; border-radius: 30px; background: #ffffffed; color: #1d573d; font-size: 12px; font-weight: 700; pointer-events: none; }
.bookmark-button { position: absolute; top: 12px; right: 12px; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: var(--app-surface); color: var(--app-accent); border: 1px solid var(--app-border); cursor: pointer; font-size: 20px; }
.bookmark-button:disabled { opacity: .5; cursor: wait; }
.destination-body { padding: 18px; }
.destination-address { color: var(--app-muted); font-size: 12px; margin: 0 0 8px; display: flex; gap: 4px; align-items: center; }
.destination-body h3 { margin: 0 0 8px; font-size: 20px; font-weight: 750; color: var(--app-heading); overflow-wrap: anywhere; }
.destination-description { margin: 0 0 16px; color: var(--app-muted); font-size: 14px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.destination-link { display: flex; align-items: center; justify-content: space-between; color: var(--app-accent); font-size: 14px; font-weight: 750; text-decoration: none; }
</style>
