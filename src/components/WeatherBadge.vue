<template>
  <span class="weather-badge-wrap">
    <button class="weather-badge" type="button" :title="current ? currentLabel : weatherLabel" :aria-label="`Show current weather for ${spot.name}`" @click.stop="toggle" @touchstart.stop.prevent="toggle">
      {{ weatherIcon }}
    </button>
    <span v-if="open" class="weather-popover" role="status" @click.stop>
      <span v-if="loading">Loading weather…</span>
      <span v-else-if="error">{{ error }}</span>
      <template v-else-if="current">
        <strong>{{ currentIcon }} {{ currentLabel }}</strong>
        <b>{{ current.temperature === null ? '—' : `${current.temperature}°C` }}</b>
        <small>Current weather</small>
      </template>
      <span v-else>{{ weatherLabel }}</span>
    </span>
  </span>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { TouristSpot } from '../lib/types';
import { getCurrentWeather, hasWeatherCoordinates, weatherCondition, type CurrentWeather } from '../lib/weather';
const props = defineProps<{ spot: TouristSpot }>();
const open = ref(false); const loading = ref(false); const error = ref(''); const current = ref<CurrentWeather | null>(null);
const suitability = computed(() => props.spot.weather_suitability ?? []);
const weatherLabel = computed(() => suitability.value.join(' · ') || 'Weather suitability not set');
const suitabilityIcon = computed(() => { if (suitability.value.includes('Rainy')) return suitability.value.includes('Cloudy') ? '🌦️' : '🌧️'; if (suitability.value.includes('Sunny') && suitability.value.includes('Cloudy')) return '🌤️'; if (suitability.value.includes('Cloudy')) return '☁️'; if (suitability.value.includes('Sunny')) return '☀️'; return '⛅'; });
const currentDetails = computed(() => weatherCondition(current.value?.weatherCode ?? null, current.value?.isDay ?? null));
const currentIcon = computed(() => currentDetails.value.icon); const currentLabel = computed(() => currentDetails.value.label);
const weatherIcon = computed(() => current.value ? currentIcon.value : suitabilityIcon.value);
async function loadCurrent() { if (current.value || loading.value) return; if (!hasWeatherCoordinates(props.spot.latitude, props.spot.longitude)) { error.value = 'Current weather unavailable for this spot.'; return; } loading.value = true; error.value = ''; try { current.value = await getCurrentWeather(props.spot.latitude as number, props.spot.longitude as number); } catch (reason) { error.value = reason instanceof Error ? reason.message : 'Current weather unavailable.'; } finally { loading.value = false; } }
async function toggle() { open.value = !open.value; if (open.value) await loadCurrent(); }
onMounted(() => { void loadCurrent(); });
</script>
<style scoped>
.weather-badge-wrap{position:relative;display:inline-flex}.weather-badge{display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--app-border);border-radius:50%;background:#ffffffed;font-size:19px;cursor:pointer;padding:0}.weather-popover{position:absolute;z-index:20;top:40px;right:0;display:grid;gap:3px;min-width:150px;padding:10px;border:1px solid var(--app-border);border-radius:10px;background:var(--app-surface);box-shadow:0 8px 24px #122d1930;color:var(--ion-text-color);font-size:11px;text-align:left}.weather-popover strong{color:var(--app-heading)}.weather-popover b{font-size:16px;color:var(--app-accent)}.weather-popover small{color:var(--app-muted)}
</style>
