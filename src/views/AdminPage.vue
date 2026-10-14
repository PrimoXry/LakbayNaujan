<template>
  <ion-page>
    <ion-split-pane content-id="main-content">
      
      <!-- 1. SLIM SIDEBAR NAVIGATION -->
      <ion-menu content-id="main-content" side="start" class="admin-sidebar">
        <ion-header class="ion-no-border">
          <ion-toolbar class="sidebar-header-toolbar">
            <div class="sidebar-brand">
              <img src="/images/logo.jpg" alt="Lakbay Naujan Logo" class="brand-logo-img" />
              <div>
                <h2>LakbayNaujan</h2>
                <span>ADMIN PANEL</span>
              </div>
            </div>
          </ion-toolbar>
        </ion-header>

        <ion-content class="sidebar-content">
          <ion-list lines="none" class="sidebar-menu-list">
            <ion-item class="menu-item active" button @click="isModalOpen = false">
              <ion-icon slot="start" :icon="gridOutline"></ion-icon>
              <ion-label>Dashboard</ion-label>
            </ion-item>
            <ion-item class="menu-item" button @click="openAddModal">
              <ion-icon slot="start" :icon="addCircleOutline"></ion-icon>
              <ion-label>Add New Spot</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>

        <!-- 2. ADMIN PROFILE SA IBABA NA MAY POPOVER LOGOUT MENU -->
        <ion-footer class="ion-no-border sidebar-footer">
          <div class="admin-profile-card" id="admin-profile-trigger" button @click="presentPopover($event)">
            <img src="/images/logo.jpg" alt="Admin Logo" class="profile-avatar-img" />
            <div class="profile-info">
              <strong>Admin User</strong>
              <span>admin@naujan.gov.ph</span>
            </div>
            <ion-icon :icon="chevronUpOutline" class="profile-chevron"></ion-icon>
          </div>
        </ion-footer>
      </ion-menu>

      <!-- ELEGANT POPOVER MENU SA TAB NG PROFILE -->
      <ion-popover 
        :is-open="isPopoverOpen" 
        :event="popoverEvent" 
        side="top" 
        alignment="start"
        @didDismiss="isPopoverOpen = false"
        class="profile-popover"
      >
        <ion-content class="ion-no-padding">
          <ion-list lines="none" class="popover-list">
            <ion-item button @click="handleLogout" class="popover-item danger">
              <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
              <ion-label>Logout</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-popover>

      <!-- 3. MAIN CONTENT AREA -->
      <div id="main-content" class="main-viewport">
        <ion-header>
          <ion-toolbar class="top-navbar">
            <ion-buttons slot="start">
              <ion-menu-button color="dark"></ion-menu-button>
            </ion-buttons>
            
            <ion-searchbar 
              placeholder="Search destinations..." 
              class="header-search" 
              v-model="searchQuery"
              :debounce="150"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding dashboard-body">
          <div class="dashboard-container">
            
            <!-- Hero Banner -->
            <div class="hero-banner">
              <div class="hero-text">
                <span class="hero-badge">🛡️ ADMINISTRATOR EXCLUSIVE ACCESS</span>
                <h1>Tourism & Destinations Management</h1>
                <p>Manage, curate, and publish eco-tourism attractions, local food establishments, map coordinates, and activity guides for Naujan, Oriental Mindoro.</p>
              </div>
              <ion-button color="success" class="add-spot-btn" @click="openAddModal">
                <ion-icon slot="start" :icon="addOutline"></ion-icon>
                ADD TOURIST SPOT
              </ion-button>
            </div>

            <!-- Stats Overview Grid (2 Cards) -->
            <ion-grid class="ion-no-padding stats-grid">
              <ion-row>
                <ion-col size="12" size-md="6">
                  <ion-card class="stat-card">
                    <ion-card-content>
                      <span class="stat-title">TOTAL SPOTS</span>
                      <div class="stat-value">{{ spots.length }}</div>
                      <span class="stat-trend">📈 Active listings</span>
                      <div class="stat-icon-bg">🗺️</div>
                    </ion-card-content>
                  </ion-card>
                </ion-col>
                <ion-col size="12" size-md="6">
                  <ion-card class="stat-card">
                    <ion-card-content>
                      <span class="stat-title">VERIFIED CARINDERIAS</span>
                      <div class="stat-value">3</div>
                      <span class="stat-trend muted">Mapped nearby</span>
                      <div class="stat-icon-bg">🍲</div>
                    </ion-card-content>
                  </ion-card>
                </ion-col>
              </ion-row>
            </ion-grid>

            <!-- Table Section -->
            <ion-card class="table-card">
              <ion-card-header class="table-card-header">
                <div>
                  <ion-card-title style="font-size: 18px; font-weight: bold; color: #0f172a;">Published Tourist Destinations</ion-card-title>
                  <ion-card-subtitle>Overview of active tourist attractions in Naujan</ion-card-subtitle>
                </div>
              </ion-card-header>

              <ion-card-content>
                <div class="table-responsive">
                  <table class="custom-admin-table">
                    <thead>
                      <tr>
                        <th>DESTINATION</th>
                        <th>CATEGORY</th>
                        <th>LOCATION</th>
                        <th>ENTRANCE FEE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="spot in filteredSpots" :key="spot.id">
                        <td>
                          <div class="table-dest-cell">
                            <img v-if="spot.image_url" :src="spot.image_url" class="dest-thumb" />
                            <div v-else class="dest-thumb placeholder">🌿</div>
                            <div><strong>{{ spot.name }}</strong></div>
                          </div>
                        </td>
                        <td><ion-badge color="light" style="color: #166534;">{{ spot.category }}</ion-badge></td>
                        <td>{{ spot.address }}</td>
                        <td>{{ spot.entrance_fee || 'Free' }}</td>
                        <td>
                          <div class="table-actions">
                            <ion-button size="small" fill="outline" color="success" @click="editSpot(spot)">Edit</ion-button>
                            <ion-button size="small" fill="outline" color="danger" @click="confirmDelete(spot)">Delete</ion-button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!filteredSpots.length">
                        <td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">
                          Walang nahanap na tourist spot.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </ion-card-content>
            </ion-card>

          </div>
        </ion-content>
      </div>

      <!-- ADD / EDIT MODAL FORM -->
      <ion-modal :is-open="isModalOpen" @didDismiss="isModalOpen = false">
        <ion-header>
          <ion-toolbar color="success">
            <ion-title>{{ editing ? 'Edit Tourist Spot' : 'Add New Tourist Spot' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="isModalOpen = false" class="modal-x-close-btn">
                <ion-icon :icon="closeOutline" style="font-size: 22px;"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content class="ion-padding">
          <form @submit.prevent="save">
            <p v-if="message" :style="{ color: errorState ? '#dc2626' : '#166534', padding: '10px', background: errorState ? '#fee2e2' : '#dcfce7', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }">
              {{ message }}
            </p>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Tourist spot name *</label>
              <ion-input v-model="form.name" required placeholder="Naujan Lake" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Category *</label>
              <ion-input v-model="form.category" required placeholder="Lake, Nature, Heritage..." style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Full description *</label>
              <ion-textarea v-model="form.description" auto-grow :rows="4" required placeholder="History, highlights, travel tips..." style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Address / Barangay *</label>
              <ion-input v-model="form.address" required placeholder="Naujan, Oriental Mindoro" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
            </div>

            <!-- Google Maps Latitude & Longitude Fields -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">
              <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Google Maps latitude (optional)</label>
                <ion-input v-model="form.latitude" type="number" placeholder="13.3..." style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
              </div>
              <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Google Maps longitude (optional)</label>
                <ion-input v-model="form.longitude" type="number" placeholder="121.3..." style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
              </div>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">For a precise map pin, copy the latitude and longitude from Google Maps. Otherwise, directions will search using its name and address.</p>
            
            <div style="margin-bottom: 16px;">
              <ion-button type="button" fill="outline" size="small" color="success" @click="previewMap">Preview Google Maps location</ion-button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Entrance fee</label>
                <ion-input v-model="form.entrance_fee" placeholder="Free / ₱50" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
              </div>
              <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Opening hours</label>
                <ion-input v-model="form.opening_hours" placeholder="8:00 AM–5:00 PM" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Best time to visit</label>
              <ion-input v-model="form.best_time_to_visit" placeholder="Morning / November–April" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
            </div>

            <div style="border: 1px dashed #cbd5e1; padding: 16px; border-radius: 8px; margin-bottom: 16px; background: #fafafa;">
              <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px;">Tourist photo (JPEG, PNG or WebP, max 5 MB)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" @change="pickImage" style="font-size: 13px;" />
              <p v-if="selectedImage" style="margin-top: 8px; font-size: 12px; color: #166534;">Selected: {{ selectedImage.name }}</p>
              <img v-else-if="form.image_url" style="margin-top: 8px; max-width: 100%; height: 120px; object-fit: cover; border-radius: 6px;" :src="form.image_url" alt="Current photo" />
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">✅ Bucket list / Things to do (one activity per line)</label>
              <ion-textarea v-model="form.bucketListText" auto-grow :rows="4" placeholder="Take landscape photos&#10;Explore the lake" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
            </div>

            <!-- Nearby Establishments -->
            <h3 style="margin-top: 24px; margin-bottom: 4px; color: #166534; font-size: 16px; font-weight: bold;">🍲 Nearby carinderias / sari-sari stores</h3>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Enter establishments you have verified are near this attraction. Each can have its own Google Maps location.</p>
            
            <div v-for="(place, index) in nearbyDrafts" :key="index" style="border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 12px; background: #f8fafc;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 13px; color: #334155;">Nearby place {{ index + 1 }}</strong>
                <ion-button size="small" fill="clear" color="danger" @click="nearbyDrafts.splice(index, 1)">Remove</ion-button>
              </div>
              <div style="margin-bottom: 10px;">
                <label style="display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 4px;">Establishment name *</label>
                <ion-input v-model="place.name" placeholder="Store name" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
              </div>
              <div style="margin-bottom: 10px;">
                <label style="display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 4px;">Type</label>
                <ion-select v-model="place.kind" interface="popover" style="border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; width: 100%;">
                  <ion-select-option value="Carinderia">Carinderia</ion-select-option>
                  <ion-select-option value="Sari-sari Store">Sari-sari Store</ion-select-option>
                  <ion-select-option value="Other">Other</ion-select-option>
                </ion-select>
              </div>
              <div style="margin-bottom: 10px;">
                <label style="display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 4px;">Address / Barangay *</label>
                <ion-input v-model="place.address" placeholder="Address" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label style="display: block; font-size: 11px; font-weight: 500; color: #475569; margin-bottom: 2px;">Latitude</label>
                  <ion-input v-model="place.lat" type="number" placeholder="Optional" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
                </div>
                <div>
                  <label style="display: block; font-size: 11px; font-weight: 500; color: #475569; margin-bottom: 2px;">Longitude</label>
                  <ion-input v-model="place.lon" type="number" placeholder="Optional" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; background: #fff;" />
                </div>
              </div>
            </div>

            <ion-button type="button" expand="block" fill="outline" color="success" style="margin-bottom: 16px;" @click="addNearby">
              + Add nearby establishment
            </ion-button>

            <ion-button type="submit" expand="block" color="success" size="large" :disabled="busy">
              {{ busy ? 'Saving...' : editing ? 'Save Changes' : 'Publish Tourist Spot' }}
            </ion-button>
          </form>
        </ion-content>
      </ion-modal>

    </ion-split-pane>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  IonPage, IonSplitPane, IonMenu, IonHeader, IonToolbar, 
  IonContent, IonList, IonItem, IonLabel, IonIcon, IonFooter, 
  IonButtons, IonMenuButton, IonButton, IonSearchbar, IonGrid, IonRow, 
  IonCol, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
  IonBadge, IonModal, IonTextarea, IonInput, IonPopover, IonSelect, IonSelectOption,
  alertController 
} from '@ionic/vue';
import { 
  gridOutline, addCircleOutline, 
  logOutOutline, addOutline, chevronUpOutline, closeOutline 
} from 'ionicons/icons';
import { supabase } from '../lib/supabase';
import type { TouristSpot, NearbyPlace } from '../lib/types';
import { mapsSearch, openMaps } from '../lib/types';

const router = useRouter();
const spots = ref<TouristSpot[]>([]);
const searchQuery = ref('');
const isModalOpen = ref(false);
const editing = ref(false);
const busy = ref(false);
const selectedImage = ref<File | null>(null);
const message = ref('');
const errorState = ref(false);

// State para sa Popover Menu sa Profile
const isPopoverOpen = ref(false);
const popoverEvent = ref<Event | null>(null);

function presentPopover(e: Event) {
  popoverEvent.value = e;
  isPopoverOpen.value = true;
}

async function handleLogout() {
  isPopoverOpen.value = false;
  await logout();
}

const form = reactive({ 
  id: '', name: '', category: 'Nature', description: '', address: '', 
  latitude: '', longitude: '', entrance_fee: '', opening_hours: '', 
  best_time_to_visit: '', image_url: '', bucketListText: '' 
});

type StoreDraft = { name: string; kind: 'Carinderia' | 'Sari-sari Store' | 'Other'; address: string; lat: string; lon: string };
const nearbyDrafts = ref<StoreDraft[]>([]);

const filteredSpots = computed(() => {
  if (!searchQuery.value.trim()) return spots.value;
  const q = searchQuery.value.toLowerCase();
  return spots.value.filter(spot => 
    spot.name.toLowerCase().includes(q) ||
    spot.address.toLowerCase().includes(q) ||
    spot.category.toLowerCase().includes(q)
  );
});

function coord(value: unknown, max: number): number | null {
  const stringValue = String(value ?? '').trim();
  if (!stringValue) return null;
  const parsed = Number(stringValue);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > max) throw new Error(`Invalid coordinate: ${stringValue}`);
  return parsed;
}

function addNearby() { 
  nearbyDrafts.value.push({ name: '', kind: 'Carinderia', address: '', lat: '', lon: '' }); 
}

function previewMap() {
  try {
    openMaps(mapsSearch({ name: form.name, address: form.address, latitude: coord(form.latitude, 90), longitude: coord(form.longitude, 180) }));
  } catch (e) { 
    errorState.value = true;
    message.value = e instanceof Error ? e.message : 'Invalid map coordinates.'; 
  }
}

function openAddModal() {
  editing.value = false;
  selectedImage.value = null;
  nearbyDrafts.value = [];
  message.value = '';
  Object.assign(form, { 
    id: '', name: '', category: 'Nature', description: '', address: '', 
    latitude: '', longitude: '', entrance_fee: '', opening_hours: '', 
    best_time_to_visit: '', image_url: '', bucketListText: '' 
  });
  isModalOpen.value = true;
}

function pickImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) { selectedImage.value = null; return; }
  selectedImage.value = file;
}

async function loadSpots() {
  const { data } = await supabase.from('tourist_spots').select('*').order('created_at', { ascending: false });
  spots.value = (data ?? []) as TouristSpot[];
}

async function editSpot(spot: TouristSpot) {
  editing.value = true;
  message.value = '';
  selectedImage.value = null;
  Object.assign(form, { 
    id: spot.id, name: spot.name, category: spot.category, description: spot.description,
    address: spot.address, latitude: spot.latitude === null ? '' : String(spot.latitude),
    longitude: spot.longitude === null ? '' : String(spot.longitude),
    entrance_fee: spot.entrance_fee ?? '', opening_hours: spot.opening_hours ?? '',
    best_time_to_visit: spot.best_time_to_visit ?? '', image_url: spot.image_url ?? '',
    bucketListText: spot.bucket_list.join('\n') 
  });
  nearbyDrafts.value = [];
  try {
    const { data } = await supabase.from('nearby_places').select('*').eq('spot_id', spot.id).order('name');
    nearbyDrafts.value = ((data ?? []) as NearbyPlace[]).map(p => ({ 
      name: p.name, kind: p.kind, address: p.address, 
      lat: p.latitude === null ? '' : String(p.latitude),
      lon: p.longitude === null ? '' : String(p.longitude) 
    }));
  } catch (e) {}
  isModalOpen.value = true;
}

async function save() {
  if (busy.value) return;
  message.value = ''; busy.value = true;
  try {
    if (!form.name.trim() || !form.description.trim() || !form.address.trim()) throw new Error('Complete required fields.');
    const latitude = coord(form.latitude, 90); 
    const longitude = coord(form.longitude, 180);
    if ((latitude === null) !== (longitude === null)) throw new Error('Enter both latitude and longitude, or leave both blank.');

    const normalizedStores = nearbyDrafts.value.map(p => {
      if (!p.name.trim() || !p.address.trim()) throw new Error('Each nearby establishment needs a name and address.');
      const lat = coord(p.lat, 90); const lon = coord(p.lon, 180);
      if ((lat === null) !== (lon === null)) throw new Error('Nearby establishment coordinates must be a pair.');
      return { name: p.name.trim(), kind: p.kind, address: p.address.trim(), latitude: lat, longitude: lon, spot_id: '' };
    });

    let imageUrl: string | null = form.image_url || null;
    if (selectedImage.value) {
      const file = selectedImage.value;
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `spots/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('tourist-images').upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      imageUrl = supabase.storage.from('tourist-images').getPublicUrl(path).data.publicUrl;
    }

    const payload = { 
      name: form.name.trim(), category: form.category.trim() || 'Nature',
      description: form.description.trim(), address: form.address.trim(), latitude, longitude,
      entrance_fee: form.entrance_fee.trim() || null, opening_hours: form.opening_hours.trim() || null,
      best_time_to_visit: form.best_time_to_visit.trim() || null, image_url: imageUrl,
      bucket_list: form.bucketListText.split('\n').map(s => s.trim()).filter(Boolean) 
    };

    let spotId: string;
    if (editing.value) {
      const { data, error } = await supabase.from('tourist_spots').update(payload).eq('id', form.id).select('id').single();
      if (error) throw error;
      spotId = data.id;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in again.');
      const { data, error } = await supabase.from('tourist_spots').insert({ ...payload, created_by: user.id }).select('id').single();
      if (error) throw error;
      spotId = data.id;
    }

    await supabase.from('nearby_places').delete().eq('spot_id', spotId);
    if (normalizedStores.length) {
      const storesWithId = normalizedStores.map(p => ({ ...p, spot_id: spotId }));
      const { error: storeError } = await supabase.from('nearby_places').insert(storesWithId);
      if (storeError) throw storeError;
    }
    
    isModalOpen.value = false;
    await loadSpots();
    errorState.value = false;
  } catch (e) { 
    errorState.value = true;
    message.value = e instanceof Error ? e.message : 'Error saving spot.'; 
  } finally { 
    busy.value = false; 
  }
}

// Binago ang header sa "Delete Confirm" at inalis ang "This action cannot be undone"
async function confirmDelete(spot: TouristSpot) {
  const alert = await alertController.create({
    header: 'Delete Confirm',
    message: `Are you sure you want to delete "${spot.name}"?`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
        cssClass: 'secondary',
      },
      {
        text: 'Delete',
        role: 'destructive',
        cssClass: 'alert-button-danger',
        handler: async () => {
          await deleteSpot(spot);
        },
      },
    ],
  });

  await alert.present();
}

async function deleteSpot(spot: TouristSpot) {
  busy.value = true;
  try {
    const { error } = await supabase.from('tourist_spots').delete().eq('id', spot.id);
    if (error) throw error;
    if (editing.value && form.id === spot.id) {
      isModalOpen.value = false;
    }
    await loadSpots();
  } catch (e) {
    errorState.value = true;
    message.value = e instanceof Error ? e.message : 'Error deleting spot.';
  } finally {
    busy.value = false;
  }
}

async function logout() {
  await supabase.auth.signOut();
  await router.replace('/login');
}

onMounted(() => {
  loadSpots();
});
</script>

<style scoped>
ion-split-pane {
  --side-width: 190px !important;
  --side-min-width: 190px !important;
  --side-max-width: 190px !important;
}

ion-menu.admin-sidebar {
  --width: 190px !important;
  --min-width: 190px !important;
  --max-width: 190px !important;
  width: 190px !important;
  min-width: 190px !important;
  max-width: 190px !important;
  --background: #113a22;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-header-toolbar {
  --background: #113a22;
  padding: 8px 10px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.sidebar-brand h2 {
  color: #ffffff;
  font-size: 13px;
  font-weight: bold;
  margin: 0;
}

.sidebar-brand span {
  color: #4ade80;
  font-size: 8px;
  letter-spacing: 0.5px;
}

.sidebar-content {
  --background: #113a22;
}

.sidebar-menu-list {
  background: transparent;
  padding: 6px;
}

.menu-item {
  --background: transparent;
  --color: #cbd5e1;
  --border-radius: 6px;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
}

.menu-item:hover, .menu-item.active {
  --background: #166534;
  --color: #ffffff;
}

.sidebar-footer {
  background: #0d2e1b;
  padding: 8px 10px;
}

.admin-profile-card {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.admin-profile-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.profile-avatar-img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: #ffffff;
  padding: 2px;
}

.profile-info {
  flex: 1;
}

.profile-info strong {
  display: block;
  color: #ffffff;
  font-size: 11px;
}

.profile-info span {
  color: #94a3b8;
  font-size: 9px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 90px;
}

.profile-chevron {
  color: #94a3b8;
  font-size: 14px;
}

.profile-popover {
  --width: 160px;
  --background: #ffffff;
  --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --border-radius: 8px;
}

.popover-list {
  padding: 4px 0;
  background: #ffffff;
}

.popover-item {
  --background: transparent;
  --color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  --min-height: 38px;
}

.popover-item ion-icon {
  color: #dc2626;
}

.modal-x-close-btn {
  --color: #ffffff;
}

.main-viewport {
  background: #f8fafc;
}

.top-navbar {
  --background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.header-search {
  max-width: 450px;
  width: 100%;
}

.dashboard-body {
  --background: #f8fafc;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-banner {
  background: linear-gradient(135deg, #113a22 0%, #166534 100%);
  border-radius: 12px;
  padding: 20px;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 15px rgba(17, 58, 34, 0.12);
}

.hero-badge {
  background: rgba(255, 255, 255, 0.15);
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
}

.hero-text h1 {
  font-size: 20px;
  font-weight: bold;
  margin: 6px 0;
}

.hero-text p {
  color: #cbd5e1;
  font-size: 12px;
  max-width: 600px;
  margin: 0;
}

.add-spot-btn {
  --background: #22c55e;
  --color: #ffffff;
  font-weight: bold;
  border-radius: 6px;
  font-size: 12px;
}

.stats-grid {
  margin-bottom: 16px;
}

.stat-card {
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
  height: 100%;
}

.stat-title {
  font-size: 10px;
  font-weight: bold;
  color: #64748b;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #0f172a;
  margin: 4px 0;
}

.stat-trend {
  font-size: 11px;
  color: #166534;
  font-weight: 500;
}

.stat-trend.muted { color: #64748b; }

.stat-icon-bg {
  position: absolute;
  right: 14px;
  bottom: 14px;
  font-size: 24px;
  opacity: 0.2;
}

.table-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

.table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-responsive {
  overflow-x: auto;
}

.custom-admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.custom-admin-table th {
  color: #64748b;
  font-size: 10px;
  font-weight: bold;
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.custom-admin-table td {
  padding: 10px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.table-dest-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dest-thumb {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
}

.dest-thumb.placeholder {
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-actions {
  display: flex;
  gap: 4px;
}
</style>

<!-- Global CSS para kulay pula ang Delete button sa alert -->
<style>
.alert-button-danger {
  color: #dc2626 !important;
  font-weight: bold !important;
}
</style>