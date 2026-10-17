<template>
  <section class="subpanel weather-card" :aria-label="`Current weather at ${spotName}`" :aria-busy="loading">
    <h2 class="section-heading">Current weather at {{ spotName }}</h2>
    <p v-if="!hasCoordinates" class="muted" role="status">Weather unavailable for {{ spotName }}. A valid map location has not been saved.</p>
    <p v-else-if="loading" class="muted" role="status">Loading weather for {{ spotName }}...</p>
    <div v-else-if="message" role="status">
      <p class="muted">{{ message }}</p>
      <ion-button type="button" size="small" fill="outline" @click="loadWeather">Retry weather</ion-button>
    </div>
    <template v-else-if="weather">
      <div v-if="warnings.length" class="weather-warning" :class="{ 'weather-warning-severe': hasSevereWarning }" role="alert" aria-atomic="true">
        <h3><span aria-hidden="true">⚠️</span> {{ hasSevereWarning ? 'Bad weather warning' : 'Weather caution' }} for {{ spotName }}</h3>
        <ul>
          <li v-for="warning in warnings" :key="warning.id"><strong>{{ warning.title }}:</strong> {{ warning.message }}</li>
        </ul>
        <p>App advisory based on estimated weather. Check <a href="https://www.pagasa.dost.gov.ph/" target="_blank" rel="noopener noreferrer">PAGASA updates</a> and local guidance before travelling.</p>
      </div>
      <div class="weather-summary">
        <span class="weather-icon" aria-hidden="true">{{ condition.icon }}</span>
        <div>
          <div class="weather-temperature">{{ number(weather.temperature) }}<span> °C</span></div>
          <strong>{{ condition.label }}</strong>
        </div>
      </div>
      <dl class="weather-metrics">
        <div><dt>Feels like</dt><dd>{{ number(weather.feelsLike) }} °C</dd></div>
        <div><dt>Humidity</dt><dd>{{ number(weather.humidity) }}%</dd></div>
        <div><dt>Wind</dt><dd>{{ number(weather.windSpeed) }} km/h</dd></div>
        <div><dt>Precipitation</dt><dd>{{ number(weather.precipitation) }} mm</dd></div>
      </dl>
      <p class="weather-time muted">As of <time :datetime="weatherTimeISO">{{ weatherTime }}</time> (Philippine time)</p>
      <p class="weather-note muted">Estimated conditions near {{ spotName }}. Local weather may vary.</p>
    </template>
    <p class="weather-credit"><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Weather data by Open-Meteo</a></p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { IonButton } from '@ionic/vue';
import { getCurrentWeather, hasWeatherCoordinates, weatherCondition, type CurrentWeather } from '../lib/weather';
import { weatherWarnings } from '../lib/weatherWarnings';

const props = defineProps<{ spotName: string; latitude: number | null; longitude: number | null }>();
const weather = ref<CurrentWeather | null>(null);
const loading = ref(false);
const message = ref('');
let requestId = 0;
const hasCoordinates = computed(() => hasWeatherCoordinates(props.latitude, props.longitude));
const condition = computed(() => weatherCondition(weather.value?.weatherCode ?? null, weather.value?.isDay ?? null));
const warnings = computed(() => weatherWarnings(weather.value));
const hasSevereWarning = computed(() => warnings.value.some(warning => warning.severity === 'warning'));
const formatter = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 1 });
const timeFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});
const weatherTime = computed(() => weather.value ? timeFormatter.format(new Date(weather.value.time * 1000)) : '');
const weatherTimeISO = computed(() => weather.value ? new Date(weather.value.time * 1000).toISOString() : '');
function number(value: number | null): string { return value === null ? '—' : formatter.format(value); }

async function loadWeather() {
  const request = ++requestId;
  weather.value = null; message.value = ''; loading.value = false;
  if (!hasCoordinates.value || props.latitude === null || props.longitude === null) return;
  loading.value = true;
  try {
    const result = await getCurrentWeather(props.latitude, props.longitude);
    if (request === requestId) weather.value = result;
  } catch (error) {
    if (request === requestId) message.value = error instanceof Error ? error.message : 'Weather is temporarily unavailable. Please try again.';
  } finally { if (request === requestId) loading.value = false; }
}

watch(() => [props.latitude, props.longitude], loadWeather, { immediate: true });
onBeforeUnmount(() => { ++requestId; });
</script>

<style scoped>
.weather-card { padding: 18px; background: linear-gradient(135deg, var(--app-surface), var(--app-soft)); overflow-wrap: anywhere; }
.weather-card h2 { margin-top: 0; }
.weather-warning { background: var(--app-warning-bg); color: var(--app-warning-text); border: 1px solid var(--app-warning-border); border-left-width: 5px; border-radius: 10px; padding: 14px; margin: 16px 0; }
.weather-warning-severe { background: var(--app-severe-bg); color: var(--app-severe-text); border-color: var(--app-severe-border); }
.weather-warning h3 { font-size: 17px; font-weight: 750; margin: 0 0 10px; }
.weather-warning ul { margin: 0; padding-left: 20px; }
.weather-warning li + li { margin-top: 8px; }
.weather-warning li { line-height: 1.5; }
.weather-warning p { margin: 12px 0 0; font-size: 13px; line-height: 1.5; }
.weather-warning a { color: inherit; font-weight: 700; text-underline-offset: 3px; }
.weather-summary { display: flex; align-items: center; gap: 16px; margin: 16px 0; }
.weather-icon { font-size: 48px; line-height: 1; }
.weather-temperature { color: var(--app-heading); font-size: 36px; font-weight: 750; }
.weather-temperature span { font-size: 22px; font-weight: 500; }
.weather-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 20px 0; }
.weather-metrics dt { color: var(--app-muted); font-size: 13px; }
.weather-metrics dd { margin: 4px 0 0; font-weight: 700; }
.weather-time, .weather-note, .weather-credit { font-size: 13px; line-height: 1.5; margin: 6px 0 0; }
.weather-credit a { color: var(--app-accent); text-underline-offset: 3px; }
@media (min-width: 600px) { .weather-metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
</style>
