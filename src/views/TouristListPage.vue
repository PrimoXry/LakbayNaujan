 <template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="dashboard-toolbar">
        <div class="dashboard-header">
          <router-link to="/tourists" class="dashboard-brand"><span class="brand-mark"><ion-icon :icon="leafOutline" aria-hidden="true" /></span><span>Lakbay<span class="brand-accent">Naujan</span><small>YOUR LOCAL TRAVEL COMPANION</small></span></router-link>
          <div class="header-account"><span class="header-greeting">Hello, <strong>{{ displayName }}</strong></span><button id="profile-menu-trigger" type="button" class="avatar-trigger" aria-label="Open profile menu" aria-haspopup="menu"><ProfileAvatar :name="displayName" :src="avatar" /></button></div>
        </div>
      </ion-toolbar>
      <ion-popover trigger="profile-menu-trigger" :dismiss-on-select="true">
        <div class="profile-menu" role="menu">
          <router-link :to="tabLink('profile')" role="menuitem"><ion-icon :icon="personOutline" aria-hidden="true" /> Profile settings</router-link>
          <router-link :to="tabLink('saved')" role="menuitem"><ion-icon :icon="bookmarkOutline" aria-hidden="true" /> Saved spots</router-link>
          <button type="button" role="menuitem" :disabled="loggingOut" @click="logout"><ion-icon :icon="logOutOutline" aria-hidden="true" /> {{ loggingOut ? 'Logging out…' : 'Log out' }}</button>
        </div>
      </ion-popover>
    </ion-header>
    <ion-content>
      <main class="dashboard-shell">
        <p v-if="accountMessage" class="feedback error" role="alert">{{ accountMessage }}</p>
        <div v-if="busy" class="dashboard-loading" role="status">Getting your dashboard ready…</div>
        <template v-else>
          <template v-if="tab === 'home'">
            <div class="dashboard-page-heading"><div><p class="eyebrow">A LITTLE CLOSER TO NATURE</p><h1>Welcome, {{ displayName }}.</h1><p class="muted">Your next discovery is right here in Naujan.</p></div><span class="location-tag"><ion-icon :icon="locationOutline" aria-hidden="true" /> Oriental Mindoro, PH</span></div>
            <section class="dashboard-hero">
              <div class="hero-copy"><span class="hero-kicker">EXPLORE LOCAL. MAKE MEMORIES.</span><h2>Find a place<br />worth the journey.</h2><p>Quiet lakes, green trails, and local favorites.<br />Start planning your next day out.</p><router-link :to="tabLink('explore')" class="ui-button hero-button">Explore destinations <ion-icon :icon="arrowForwardOutline" aria-hidden="true" /></router-link></div>
              <div class="hero-art" aria-hidden="true"><img v-if="featuredImage" :src="featuredImage" alt="" /><div v-else class="landscape"><span class="landscape-sun" /><span class="landscape-hill back" /><span class="landscape-hill front" /><span class="landscape-water" /></div></div>
            </section>
            <section class="overview-stats" aria-label="Quick overview">
              <router-link :to="tabLink('explore')" class="overview-stat"><span class="stat-icon"><ion-icon :icon="compassOutline" aria-hidden="true" /></span><span><strong>{{ spotsMessage ? '—' : spots.length }}</strong><small>Places to explore</small></span><ion-icon :icon="arrowForwardOutline" aria-hidden="true" /></router-link>
              <router-link :to="tabLink('saved')" class="overview-stat"><span class="stat-icon"><ion-icon :icon="bookmarkOutline" aria-hidden="true" /></span><span><strong>{{ savedReady ? savedIds.length : '—' }}</strong><small>Your saved spots</small></span><ion-icon :icon="arrowForwardOutline" aria-hidden="true" /></router-link>
              <div class="overview-stat"><span class="stat-icon"><ion-icon :icon="trailSignOutline" aria-hidden="true" /></span><span><strong>{{ spotsMessage ? '—' : categories.length }}</strong><small>Ways to discover</small></span></div>
            </section>
            <div class="section-topline"><div><p class="eyebrow">YOUR NEXT STOP</p><h2>Discover somewhere new</h2></div><router-link :to="tabLink('explore')">View all <ion-icon :icon="arrowForwardOutline" aria-hidden="true" /></router-link></div>
          </template>
          <template v-else-if="tab === 'explore'">
            <div class="dashboard-page-heading"><div><p class="eyebrow">GO A LITTLE FURTHER</p><h1>Explore Naujan</h1><p class="muted">Find your next favorite place.</p></div></div>
            <div class="explore-controls"><label class="dashboard-search"><ion-icon :icon="searchOutline" aria-hidden="true" /><input v-model="search" type="search" placeholder="Search destinations, activities or barangays" aria-label="Search destinations" /></label><label class="category-filter">Category<select v-model="category"><option value="">All categories</option><option v-for="item in categories" :key="item" :value="item">{{ item }}</option></select></label></div>
            <p class="results-count muted">{{ visibleSpots.length }} {{ visibleSpots.length === 1 ? 'destination' : 'destinations' }} to discover</p>
          </template>
          <template v-else-if="tab === 'saved'">
            <div class="dashboard-page-heading"><div><p class="eyebrow">KEEP THE PLACES YOU LOVE</p><h1>Saved spots</h1><p class="muted">A little inspiration for your next adventure.</p></div><router-link :to="tabLink('explore')" class="ui-button ui-button-secondary">Explore more</router-link></div>
          </template>
          <template v-else>
            <div class="dashboard-page-heading"><div><p class="eyebrow">YOUR LAKBAYNAUJAN</p><h1>Profile & settings</h1><p class="muted">Your details, your preferences, your way.</p></div><router-link :to="tabLink('saved')" class="ui-button ui-button-secondary"><ion-icon :icon="bookmarkOutline" aria-hidden="true" /> Saved spots</router-link></div>
            <ProfileSettings v-if="profile" :key="profile.id" :profile="profile" :email="email" :avatar="avatar" :logging-out="loggingOut" :password-login="passwordLogin" @updated="profileUpdated" @logout="logout" />
            <div v-else class="dashboard-empty"><h2>We couldn’t load your profile.</h2><button type="button" class="ui-button" @click="load">Try again</button></div>
          </template>
          <template v-if="tab !== 'profile'">
            <p v-if="spotsMessage" class="feedback error" role="alert">{{ spotsMessage }} <button type="button" class="inline-retry" @click="load">Retry</button></p>
            <p v-if="savedMessage" class="feedback error" role="alert">{{ savedMessage }} <button type="button" class="inline-retry" @click="reloadSaved">Retry saved spots</button></p>
            <p v-if="saveMessage" class="feedback error" role="alert">{{ saveMessage }}</p>
            <div class="destination-grid"><DestinationCard v-for="spot in visibleSpots" :key="spot.id" :spot="spot" :saved="savedIds.includes(spot.id)" :saving="savingIds.includes(spot.id)" :save-disabled="!savedReady || !userId || loggingOut" @toggle-save="toggleSave" /></div>
            <div v-if="!visibleSpots.length && !spotsMessage && !(tab === 'saved' && savedMessage)" class="dashboard-empty"><ion-icon :icon="tab === 'saved' ? bookmarkOutline : compassOutline" aria-hidden="true" /><h2>{{ tab === 'saved' ? 'Your next adventure starts with a save.' : 'No destinations found.' }}</h2><p class="muted">{{ tab === 'saved' ? 'Tap the bookmark on a destination to keep it here.' : tab === 'explore' && (search || category) ? 'Try another search or category.' : 'New places will appear here as they are added.' }}</p><router-link v-if="tab === 'saved'" :to="tabLink('explore')" class="ui-button">Explore destinations</router-link></div>
          </template>
        </template>
      </main>
    </ion-content>
    <ion-footer class="ion-no-border dashboard-footer"><nav class="dashboard-navigation" aria-label="User dashboard"><router-link v-for="item in navigation" :key="item.id" :to="tabLink(item.id)" :class="{ active: tab === item.id }" :aria-current="tab === item.id ? 'page' : undefined"><ion-icon :icon="item.icon" aria-hidden="true" /><span>{{ item.label }}</span></router-link></nav></ion-footer>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonContent, IonFooter, IonIcon, IonPopover, onIonViewWillEnter } from '@ionic/vue';
import { leafOutline, locationOutline, compassOutline, bookmarkOutline, homeOutline, personOutline, searchOutline, arrowForwardOutline, trailSignOutline, logOutOutline } from 'ionicons/icons';
import ProfileAvatar from '../components/ProfileAvatar.vue';
import ProfileSettings from '../components/ProfileSettings.vue';
import DestinationCard from '../components/DestinationCard.vue';
import { supabase } from '../lib/supabase';
import { accountError, avatarUrl, loadUserProfile, loadSavedSpots, setSpotSaved, type UserProfile } from '../lib/userAccount';
import type { TouristSpot } from '../lib/types';
import { spotImages } from '../lib/spotPhotos';
type Tab = 'home' | 'explore' | 'saved' | 'profile';
const navigation: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: homeOutline }, { id: 'explore', label: 'Explore', icon: compassOutline },
  { id: 'saved', label: 'Saved', icon: bookmarkOutline }, { id: 'profile', label: 'Profile', icon: personOutline },
];
const router = useRouter(); const route = useRoute();
const tab = computed<Tab>(() => ['explore', 'saved', 'profile'].includes(String(route.query.tab)) ? route.query.tab as Tab : 'home');
const tabLink = (value: Tab) => ({ path: '/tourists', query: value === 'home' ? {} : { tab: value } });
const profile = ref<UserProfile | null>(null); const userId = ref(''); const email = ref(''); const avatar = ref<string | null>(null);
const passwordLogin = ref(true);
const spots = ref<TouristSpot[]>([]); const savedIds = ref<string[]>([]); const savedReady = ref(false); const savingIds = ref<string[]>([]);
const search = ref(''); const category = ref(''); const busy = ref(false); const loggingOut = ref(false);
const accountMessage = ref(''); const spotsMessage = ref(''); const savedMessage = ref(''); const saveMessage = ref('');
let loadRequest = 0; let avatarRequest = 0; let savedRequest = 0;
const displayName = computed(() => profile.value?.display_name || profile.value?.username || 'traveler');
const categories = computed(() => [...new Set(spots.value.map(spot => spot.category))].sort());
const featuredImage = computed(() => spots.value.map(spot => spotImages(spot)[0]).find(Boolean));
const visibleSpots = computed(() => {
  if (tab.value === 'home') return spots.value.slice(0, 3);
  if (tab.value === 'saved') return savedIds.value.map(id => spots.value.find(spot => spot.id === id)).filter((spot): spot is TouristSpot => !!spot);
  const query = search.value.trim().toLowerCase();
  return spots.value.filter(spot => (!category.value || spot.category === category.value)
    && `${spot.name} ${spot.address} ${spot.category} ${spot.description} ${spot.bucket_list.join(' ')}`.toLowerCase().includes(query));
});
function clearAccount() {
  ++loadRequest; ++avatarRequest; ++savedRequest;
  profile.value = null; avatar.value = null; userId.value = ''; email.value = ''; savedIds.value = []; savedReady.value = false;
  spots.value = []; savingIds.value = []; search.value = ''; category.value = ''; saveMessage.value = ''; busy.value = false;
  passwordLogin.value = true;
}
async function refreshAvatar(value: UserProfile) {
  const request = ++avatarRequest; avatar.value = null;
  try { const url = await avatarUrl(value.avatar_path); if (request === avatarRequest && value.id === userId.value) avatar.value = url; }
  catch { if (request === avatarRequest) accountMessage.value = 'Your profile picture could not load. You can still use your account.'; }
}
function profileUpdated(value: UserProfile) {
  if (value.id !== userId.value) return;
  profile.value = value; void refreshAvatar(value);
}
async function reloadSaved() {
  if (!userId.value) return;
  const id = userId.value; const request = ++savedRequest;
  savedMessage.value = ''; savedReady.value = false;
  try { const ids = await loadSavedSpots(id); if (id === userId.value && request === savedRequest) { savedIds.value = ids; savedReady.value = true; } }
  catch (error) { if (id === userId.value && request === savedRequest) savedMessage.value = accountError(error, 'Could not load your saved spots.'); }
}
async function load() {
  clearAccount(); const request = ++loadRequest;
  busy.value = true; accountMessage.value = ''; spotsMessage.value = ''; savedMessage.value = '';
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (request !== loadRequest) return;
    if (!data.user) { await router.replace('/login'); return; }
    userId.value = data.user.id; email.value = data.user.email ?? '';
    passwordLogin.value = data.user.app_metadata?.provider !== 'google' || data.user.app_metadata?.providers?.includes('email') === true;
    const [profileResult, spotsResult, savedResult] = await Promise.allSettled([
      loadUserProfile(data.user.id), supabase.from('tourist_spots').select('*').order('created_at', { ascending: false }), reloadSaved(),
    ]);
    if (request !== loadRequest) return;
    if (profileResult.status === 'fulfilled') { profile.value = profileResult.value; void refreshAvatar(profileResult.value); }
    else accountMessage.value = accountError(profileResult.reason, 'Could not load your profile.');
    if (spotsResult.status === 'fulfilled' && !spotsResult.value.error) spots.value = (spotsResult.value.data ?? []) as TouristSpot[];
    else spotsMessage.value = accountError(spotsResult.status === 'rejected' ? spotsResult.reason : spotsResult.value.error, 'Could not load destinations.');
    if (savedResult.status === 'rejected') savedMessage.value = accountError(savedResult.reason, 'Could not load your saved spots.');
  } catch (error) { if (request === loadRequest) accountMessage.value = accountError(error, 'Could not load your account. Please try logging in again.'); }
  finally { if (request === loadRequest) busy.value = false; }
}
async function toggleSave(spot: TouristSpot) {
  if (!userId.value || !savedReady.value || savingIds.value.includes(spot.id) || loggingOut.value) return;
  const id = userId.value; const saved = !savedIds.value.includes(spot.id);
  savingIds.value = [...savingIds.value, spot.id]; saveMessage.value = '';
  try {
    await setSpotSaved(id, spot.id, saved);
    if (id !== userId.value) return;
    savedIds.value = saved ? [spot.id, ...savedIds.value.filter(value => value !== spot.id)] : savedIds.value.filter(value => value !== spot.id);
  } catch (error) { if (id === userId.value) saveMessage.value = accountError(error, 'Could not update your saved spots.'); }
  finally { if (id === userId.value) savingIds.value = savingIds.value.filter(value => value !== spot.id); }
}
async function logout() {
  if (loggingOut.value) return;
  loggingOut.value = true; accountMessage.value = '';
  try { const { error } = await supabase.auth.signOut(); if (error) throw error; clearAccount(); await router.replace('/login'); }
  catch (error) { accountMessage.value = accountError(error, 'Could not log out. Please try again.'); }
  finally { loggingOut.value = false; }
}
const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (userId.value && session?.user.id && session.user.id !== userId.value)) clearAccount();
});
onIonViewWillEnter(load);
onBeforeUnmount(() => { clearAccount(); authListener.subscription.unsubscribe(); });
</script>
<style src="../theme/dashboard.css" scoped></style>
