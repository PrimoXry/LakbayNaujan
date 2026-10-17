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
            <div style="min-width:160px;flex:1"><strong>{{ spot.name }}</strong><div class="muted">{{ spot.address }}</div></div>
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
            <div class="field-label">Tourist photo (JPEG, PNG or WebP, max 5 MB)</div>
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="pickImage" />
            <p class="muted" v-if="selectedImage">Selected: {{ selectedImage.name }}</p>
            <img v-else-if="form.image_url" class="cover" style="max-width:300px;height:150px;border-radius:8px" :src="form.image_url" alt="Current destination photo" />
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
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { onIonViewWillEnter, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonInput, IonTextarea, IonSelect, IonSelectOption } from '@ionic/vue';
import { supabase } from '../lib/supabase';
import type { TouristSpot, NearbyPlace } from '../lib/types';
import { mapsSearch, openMaps } from '../lib/types';
import { errorMessage } from '../lib/errors';

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
function showError(e: unknown) { errorState.value = true; message.value = errorMessage(e, 'Something went wrong.'); }
async function loadSpots() {
  const { data } = await supabase.from('tourist_spots').select('*').order('created_at', { ascending: false });
  spots.value = (data ?? []) as TouristSpot[];
}

async function editSpot(spot: TouristSpot) {
  if (busy.value) return;
  busy.value = true; message.value = '';
  try {
    const { data, error } = await supabase.from('nearby_places').select('*').eq('spot_id', spot.id).order('name');
    if (error) throw error;
    // Only replace the editable form after the related records have loaded.
    editing.value = true; selectedImage.value = null;
    Object.assign(form, { id: spot.id, name: spot.name, category: spot.category, description: spot.description,
      address: spot.address, latitude: spot.latitude === null ? '' : String(spot.latitude),
      longitude: spot.longitude === null ? '' : String(spot.longitude),
      entrance_fee: spot.entrance_fee ?? '', opening_hours: spot.opening_hours ?? '',
      best_time_to_visit: spot.best_time_to_visit ?? '', image_url: spot.image_url ?? '',
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
      return { name: p.name.trim(), kind: p.kind, address: p.address.trim(), latitude: lat, longitude: lon, spot_id: '' };
    });
    const payload = { name: form.name.trim(), category: form.category.trim() || 'Nature',
      description: form.description.trim(), address: form.address.trim(), latitude, longitude,
      entrance_fee: form.entrance_fee.trim() || null, opening_hours: form.opening_hours.trim() || null,
      best_time_to_visit: form.best_time_to_visit.trim() || null, image_url: form.image_url || null,
      bucket_list: form.bucketListText.split('\n').map(s => s.trim()).filter(Boolean) };
    const file = selectedImage.value;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Please log in again.');
    if (file) {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `spots/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('tourist-images').upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      payload.image_url = supabase.storage.from('tourist-images').getPublicUrl(path).data.publicUrl;
    }
    let spotId: string;
    if (editingId) {
      const { data, error } = await supabase.from('tourist_spots').update(payload).eq('id', editingId).select('id').single();
      if (error) throw error;
      spotId = data.id;
    } else {
      const { data, error } = await supabase.from('tourist_spots').insert({ ...payload, created_by: user.id }).select('id').single();
      if (error) throw error;
      spotId = data.id;
    }
    // A retry must update the row already created, rather than inserting a duplicate.
    editing.value = true; form.id = spotId; form.image_url = payload.image_url ?? ''; selectedImage.value = null;
    partialSaveMessage = 'The destination was saved, but nearby places could not be fully updated. Keep this form open and retry. ';
    // MVP synchronization: delete old nearby entries, then insert the new list.
    // If the second request fails, the spot may be saved without all stores; retry the edit.
    const { error: deleteError } = await supabase.from('nearby_places').delete().eq('spot_id', spotId);
    if (deleteError) throw deleteError;
    if (normalizedStores.length) {
      const storesWithId = normalizedStores.map(p => ({ ...p, spot_id: spotId }));
      const { error: storeError } = await supabase.from('nearby_places').insert(storesWithId);
      if (storeError) throw storeError;
    }
    partialSaveMessage = 'The destination was saved, but the list could not be refreshed. ';
    startNew();
    await loadSpots();
    errorState.value = false; message.value = 'Tourist spot saved successfully.';
  } catch (e) { showError(e); message.value = partialSaveMessage + message.value; }
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