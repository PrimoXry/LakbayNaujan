
<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>🌿 LakbayNaujan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Welcome Banner -->
      <div class="hero">
        <span class="location">📍 Naujan, Oriental Mindoro</span>
        <h1>Discover the Beauty of Naujan</h1>
        <p>Explore breathtaking destinations and hidden gems.</p>
      </div>

      <div class="main">
        <!-- Search -->
        <ion-searchbar
          v-model="search"
          placeholder="Search destinations..."
          mode="ios"
        />

        <h2>Explore Categories</h2>

        <div class="categories">
          <ion-chip
            v-for="category in categories"
            :key="category"
            :color="selectedCategory === category ? 'success' : 'medium'"
            @click="selectedCategory = category"
          >
            {{ category }}
          </ion-chip>
        </div>

        <h2>Popular Destinations</h2>

        <ion-card
          v-for="spot in filteredSpots"
          :key="spot.id"
          class="spot-card"
        >
          <div class="image-container">
            <img
              :src="spot.image"
              :alt="spot.name"
              @error="handleImageError"
            />
          </div>

          <ion-card-header>
            <ion-card-title>{{ spot.name }}</ion-card-title>
            <ion-card-subtitle>
              📍 {{ spot.location }}
            </ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <p>{{ spot.description }}</p>

            <ion-button
              expand="block"
              color="success"
              @click="selectedSpot = spot"
            >
              View Details
            </ion-button>
          </ion-card-content>
        </ion-card>

        <p v-if="filteredSpots.length === 0" class="empty">
          No destinations found.
        </p>
      </div>
    </ion-content>

    <!-- Destination Details -->
    <ion-modal
      :is-open="selectedSpot !== null"
      @didDismiss="selectedSpot = null"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Destination Details</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="selectedSpot = null">
              Close
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content v-if="selectedSpot" class="ion-padding">
        <h1>{{ selectedSpot.name }}</h1>
        <p>📍 {{ selectedSpot.location }}</p>
        <p>{{ selectedSpot.details }}</p>

        <ion-button
          expand="block"
          color="success"
          @click="getDirections(selectedSpot)"
        >
          Get Directions via Google Maps
        </ion-button>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonSearchbar, IonChip,
  IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonButton,
  IonModal, IonButtons
} from '@ionic/vue';

interface TouristSpot {
  id: number;
  name: string;
  location: string;
  category: string;
  image: string;
  description: string;
  details: string;
}

const search = ref('');
const selectedCategory = ref('All');
const selectedSpot = ref<TouristSpot | null>(null);

const categories = ['All', 'Lake', 'River'];

const spots: TouristSpot[] = [
  {
    id: 1,
    name: 'Naujan Lake',
    location: 'Naujan, Oriental Mindoro',
    category: 'Lake',
    image: '/images/naujan-lake.jpg',
    description: 'Discover the natural beauty of Naujan Lake.',
    details:
      'Naujan Lake is a freshwater lake and an important wetland habitat for fish and migratory birds.'
  },
  {
    id: 2,
    name: 'Paitan River',
    location: 'Paitan, Naujan',
    category: 'River',
    image: '/images/paitan-river.jpg',
    description: 'Experience the peaceful scenery of Paitan River.',
    details:
      'Paitan River is a natural attraction in Naujan with views toward Mount Halcon.'
  }
];

const filteredSpots = computed(() => {
  return spots.filter((spot) => {
    const matchesSearch = spot.name
      .toLowerCase()
      .includes(search.value.toLowerCase());

    const matchesCategory =
      selectedCategory.value === 'All' ||
      spot.category === selectedCategory.value;

    return matchesSearch && matchesCategory;
  });
});

function getDirections(spot: TouristSpot) {
  const destination = encodeURIComponent(
    `${spot.name}, ${spot.location}, Oriental Mindoro, Philippines`
  );

  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
    '_blank'
  );
}

function handleImageError(event: Event) {
  const image = event.target as HTMLImageElement;
  image.style.display = 'none';
}
</script>

<style scoped>
ion-toolbar {
  --background: #ffffff;
  --color: #17633e;
}

ion-content {
  --background: #f5f8f4;
}

.hero {
  padding: 45px 25px;
  background: linear-gradient(135deg, #145c3c, #4b9c60);
  color: white;
  border-radius: 0 0 32px 32px;
}

.location {
  font-size: 12px;
  background: rgba(255,255,255,0.18);
  padding: 8px 12px;
  border-radius: 20px;
}

.hero h1 {
  font-size: 29px;
  font-weight: 800;
  line-height: 1.2;
  margin-top: 24px;
}

.hero p {
  font-size: 14px;
  opacity: 0.9;
}

.main {
  padding: 18px;
}

h2 {
  font-size: 19px;
  font-weight: 700;
  color: #194d34;
  margin: 22px 0 12px;
}

ion-searchbar {
  --background: #ffffff;
  --border-radius: 14px;
  padding: 0;
}

.categories {
  display: flex;
  gap: 5px;
  overflow-x: auto;
}

ion-chip {
  cursor: pointer;
}

.spot-card {
  border-radius: 18px;
  margin: 15px 0;
  box-shadow: 0 5px 18px rgba(0,0,0,0.07);
}

.image-container {
  height: 185px;
  background: linear-gradient(135deg, #a9d6b2, #3c8763);
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

ion-card-title {
  font-size: 20px;
  color: #20533a;
}

ion-card-content p {
  line-height: 1.6;
  margin-bottom: 16px;
}

.empty {
  text-align: center;
  color: #777;
  padding: 25px;
}
</style>
