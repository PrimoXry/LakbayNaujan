<template>
  <section class="subpanel weather-card" :class="weatherTheme" :aria-label="`Current weather at ${spotName}`" :aria-busy="loading">
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
      <div class="weather-hero">
        <div class="weather-hero-copy">
          <span class="weather-kicker">Current conditions</span>
          <strong class="weather-condition">{{ condition }}</strong>
          <div class="weather-temperature">{{ number(weather.temperature) }}<span>°C</span></div>
        </div>
        <div class="weather-art" aria-hidden="true">
          <svg viewBox="0 0 160 120" role="presentation">
            <g v-if="weatherVisual === 'sunny' || weatherVisual === 'partly-cloudy'" class="weather-sun">
              <path d="M80 7v12M80 83v12M36 51h12M112 51h12M49 20l9 9M102 73l9 9M111 20l-9 9M58 73l-9 9" />
              <circle cx="80" cy="51" r="23" />
            </g>
            <g v-if="weatherVisual === 'clear-night'" class="weather-stars">
              <path d="m47 34 3 7 7 3-7 3-3 7-3-7-7-3 7-3zM111 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM121 61l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" />
              <circle cx="76" cy="23" r="2" /><circle cx="35" cy="65" r="2" />
            </g>
            <g v-if="['partly-cloudy', 'cloudy', 'rain', 'storm', 'snow', 'fog'].includes(weatherVisual)" class="weather-cloud">
              <path d="M39 85h79a20 20 0 0 0 0-40 31 31 0 0 0-59-7A25 25 0 0 0 39 85Z" />
            </g>
            <g v-if="weatherVisual === 'rain'" class="weather-rain">
              <path d="m52 95-5 12m27-12-5 12m27-12-5 12m27-12-5 12" />
            </g>
            <g v-if="weatherVisual === 'storm'" class="weather-lightning">
              <path d="m83 85-15 23h13l-5 16 22-28H84l8-11z" />
            </g>
            <g v-if="weatherVisual === 'snow'" class="weather-snow">
              <circle cx="53" cy="103" r="3" /><circle cx="80" cy="108" r="3" /><circle cx="107" cy="101" r="3" />
            </g>
            <g v-if="weatherVisual === 'fog'" class="weather-fog">
              <path d="M37 97h84M47 108h67" />
            </g>
          </svg>
        </div>
      </div>
      <dl class="weather-metrics">
        <div><dt>Feels like</dt><dd>{{ number(weather.feelsLike) }} °C</dd></div>
        <div><dt>Humidity</dt><dd>{{ number(weather.humidity) }}%</dd></div>
        <div><dt>Wind</dt><dd>{{ number(weather.windSpeed) }} km/h</dd></div>
        <div><dt>Precipitation</dt><dd>{{ number(weather.precipitation) }} mm</dd></div>
      </dl>
      <section v-if="weather.forecast?.length" class="weather-forecast" aria-label="Three-day weather forecast">
        <div class="weather-forecast-heading"><h3>Next 3 days</h3><span>Daily forecast</span></div>
        <div class="weather-forecast-grid">
          <article v-for="day in weather.forecast" :key="day.date" class="forecast-day-card">
            <time class="forecast-date" :datetime="day.date">{{ forecastDay(day.time) }}</time>
            <svg class="forecast-icon" viewBox="0 0 160 120" aria-hidden="true">
              <g v-if="['sunny', 'partly-cloudy'].includes(forecastVisual(day.weatherCode))" class="weather-sun">
                <path d="M80 7v12M80 83v12M36 51h12M112 51h12M49 20l9 9M102 73l9 9M111 20l-9 9M58 73l-9 9" />
                <circle cx="80" cy="51" r="23" />
              </g>
              <g v-if="['partly-cloudy', 'cloudy', 'rain', 'storm', 'snow', 'fog'].includes(forecastVisual(day.weatherCode))" class="weather-cloud">
                <path d="M39 85h79a20 20 0 0 0 0-40 31 31 0 0 0-59-7A25 25 0 0 0 39 85Z" />
              </g>
              <path v-if="forecastVisual(day.weatherCode) === 'rain'" class="weather-rain" d="m52 95-5 12m27-12-5 12m27-12-5 12m27-12-5 12" />
              <path v-if="forecastVisual(day.weatherCode) === 'storm'" class="weather-lightning" d="m83 85-15 23h13l-5 16 22-28H84l8-11z" />
              <g v-if="forecastVisual(day.weatherCode) === 'snow'" class="weather-snow">
                <circle cx="53" cy="103" r="3" /><circle cx="80" cy="108" r="3" /><circle cx="107" cy="101" r="3" />
              </g>
              <path v-if="forecastVisual(day.weatherCode) === 'fog'" class="weather-fog" d="M37 97h84M47 108h67" />
            </svg>
            <span class="forecast-condition">{{ forecastCondition(day.weatherCode) }}</span>
            <div class="forecast-temperatures"><strong>{{ number(day.high) }}°</strong><span>{{ number(day.low) }}°</span></div>
            <span v-if="day.precipitationProbability !== null" class="forecast-rain-chance">Rain {{ number(day.precipitationProbability) }}%</span>
          </article>
        </div>
      </section>
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

const props = defineProps<{ spotName: string; category?: string; latitude: number | null; longitude: number | null }>();
const weather = ref<CurrentWeather | null>(null);
const loading = ref(false);
const message = ref('');
let requestId = 0;
const hasCoordinates = computed(() => hasWeatherCoordinates(props.latitude, props.longitude));
const condition = computed(() => weatherCondition(weather.value?.weatherCode ?? null, weather.value?.isDay ?? null).label);
type WeatherVisual = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog' | 'clear-night';
function visualForWeather(code: number | null, isDay: boolean | null): WeatherVisual {
  if (code === null) return 'cloudy';
  if ([95, 96, 97, 98, 99].includes(code)) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code === 3 || (code === 2 && isDay === false)) return 'cloudy';
  if (code === 2) return 'partly-cloudy';
  if (code === 0 || code === 1) return isDay === false ? 'clear-night' : 'sunny';
  return 'cloudy';
}
const weatherVisual = computed(() => visualForWeather(weather.value?.weatherCode ?? null, weather.value?.isDay ?? null));
function forecastVisual(code: number | null): WeatherVisual { return visualForWeather(code, true); }
function forecastCondition(code: number | null): string { return weatherCondition(code, true).label; }
const weatherTheme = computed(() => {
  const code = weather.value?.weatherCode;
  const isDay = weather.value?.isDay;
  if (code === null || code === undefined) return 'weather-theme-default';
  if ([95, 96, 97, 98, 99].includes(code)) return 'weather-theme-storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'weather-theme-snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'weather-theme-rain';
  if (code === 45 || code === 48) return 'weather-theme-fog';
  if (code === 3) return 'weather-theme-cloudy';
  if (code === 2) return isDay === false ? 'weather-theme-cloudy-night' : 'weather-theme-partly-cloudy';
  if (code === 0 || code === 1) return isDay === false ? 'weather-theme-clear-night' : 'weather-theme-clear-day';
  return 'weather-theme-default';
});
const warnings = computed(() => weatherWarnings(weather.value, props.category));
const hasSevereWarning = computed(() => warnings.value.some(warning => warning.severity === 'warning'));
const formatter = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 1 });
const timeFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});
const forecastDayFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric',
});
const weatherTime = computed(() => weather.value ? timeFormatter.format(new Date(weather.value.time * 1000)) : '');
const weatherTimeISO = computed(() => weather.value ? new Date(weather.value.time * 1000).toISOString() : '');
function forecastDay(timestamp: number): string { return forecastDayFormatter.format(new Date(timestamp * 1000)); }
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
.weather-card { position: relative; padding: 18px; color: var(--weather-text, var(--ion-text-color)); background: var(--weather-background, linear-gradient(135deg, var(--app-surface), var(--app-soft))); border-color: var(--weather-border, var(--app-border)); overflow: hidden; overflow-wrap: anywhere; transition: background 300ms ease, border-color 300ms ease, color 300ms ease; }
.weather-theme-clear-day { --weather-background: linear-gradient(135deg, #fff3c4 0%, #ffdc91 48%, #f7b77d 100%); --weather-text: #263b4d; --weather-muted: #526a7c; --weather-border: #e8c57f; --weather-glow: #fff9d5; --weather-panel: #ffffff80; --weather-panel-border: #ffffff8c; }
.weather-theme-partly-cloudy { --weather-background: linear-gradient(135deg, #d7f0ff 0%, #a9d9f2 52%, #c9e8e9 100%); --weather-text: #25465b; --weather-muted: #4c687a; --weather-border: #acd4e4; --weather-glow: #f7fdffcc; --weather-panel: #ffffff80; --weather-panel-border: #ffffffa1; }
.weather-theme-cloudy { --weather-background: linear-gradient(135deg, #e0e7ec 0%, #bdcbd4 50%, #aebfca 100%); --weather-text: #293b49; --weather-muted: #526675; --weather-border: #b6c4cd; --weather-glow: #ffffffb3; --weather-panel: #ffffff80; --weather-panel-border: #ffffffa1; }
.weather-theme-cloudy-night { --weather-background: linear-gradient(135deg, #293c55 0%, #465c73 54%, #627588 100%); --weather-text: #f3f7fb; --weather-muted: #d0dce7; --weather-border: #526a80; --weather-glow: #b8d6f733; --weather-panel: #14253c55; --weather-panel-border: #ffffff30; }
.weather-theme-clear-night { --weather-background: linear-gradient(135deg, #17233f 0%, #293c61 55%, #465c7c 100%); --weather-text: #f6f5ff; --weather-muted: #d5d9ee; --weather-border: #394b70; --weather-glow: #c3d6ff55; --weather-panel: #101b355c; --weather-panel-border: #ffffff30; }
.weather-theme-fog { --weather-background: linear-gradient(135deg, #e5ebec 0%, #c9d5d8 48%, #aebfc5 100%); --weather-text: #2d4149; --weather-muted: #566a71; --weather-border: #bac9cd; --weather-glow: #ffffffc9; --weather-panel: #ffffff85; --weather-panel-border: #ffffffa6; }
.weather-theme-rain { --weather-background: linear-gradient(135deg, #315875 0%, #467a96 52%, #6e9eae 100%); --weather-text: #f7fbff; --weather-muted: #e0edf4; --weather-border: #547f98; --weather-glow: #d6efff38; --weather-panel: #16395455; --weather-panel-border: #ffffff38; }
.weather-theme-snow { --weather-background: linear-gradient(135deg, #edf9ff 0%, #cde8f4 52%, #b8d6e8 100%); --weather-text: #26475d; --weather-muted: #547183; --weather-border: #c3dce8; --weather-glow: #ffffffd9; --weather-panel: #ffffff91; --weather-panel-border: #ffffffb3; }
.weather-theme-storm { --weather-background: linear-gradient(135deg, #202b43 0%, #394462 50%, #5c526e 100%); --weather-text: #f7f6ff; --weather-muted: #e0dfee; --weather-border: #4b526a; --weather-glow: #ffd97842; --weather-panel: #111a2d66; --weather-panel-border: #ffffff38; }
.weather-card > * { position: relative; z-index: 1; }
.weather-card h2 { margin-top: 0; color: var(--weather-text, var(--app-heading)); }
.weather-warning { background: var(--app-warning-bg); color: var(--app-warning-text); border: 1px solid var(--app-warning-border); border-left-width: 5px; border-radius: 10px; padding: 14px; margin: 16px 0; }
.weather-warning-severe { background: var(--app-severe-bg); color: var(--app-severe-text); border-color: var(--app-severe-border); }
.weather-warning h3 { font-size: 17px; font-weight: 750; margin: 0 0 10px; }
.weather-warning ul { margin: 0; padding-left: 20px; }
.weather-warning li + li { margin-top: 8px; }
.weather-warning li { line-height: 1.5; }
.weather-warning p { margin: 12px 0 0; font-size: 13px; line-height: 1.5; }
.weather-warning a { color: inherit; font-weight: 700; text-underline-offset: 3px; }
.weather-hero { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 158px; margin: 16px 0; padding: 18px 20px; border: 1px solid var(--weather-panel-border, var(--app-border)); border-radius: 18px; background: var(--weather-panel, var(--app-surface)); }
.weather-hero-copy { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; }
.weather-kicker { color: var(--weather-muted, var(--app-muted)); font-size: 11px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.weather-condition { margin-top: 5px; color: var(--weather-text, var(--app-heading)); font-size: 18px; }
.weather-temperature { margin-top: 3px; color: var(--weather-text, var(--app-heading)); font-size: clamp(46px, 11vw, 60px); font-weight: 800; line-height: 1.05; letter-spacing: -.055em; }
.weather-temperature span { margin-left: 5px; font-size: 20px; font-weight: 650; letter-spacing: 0; vertical-align: 1.25em; }
.weather-art { flex: 0 0 clamp(94px, 28vw, 142px); width: clamp(94px, 28vw, 142px); }
.weather-art svg { display: block; width: 100%; overflow: visible; }
.weather-sun { fill: #ffd166; stroke: #f3a73a; stroke-width: 4; stroke-linecap: round; }
.weather-stars { fill: #fff2b4; }
.weather-cloud { fill: #f8fcff; stroke: #dcecf3; stroke-width: 2; stroke-linejoin: round; }
.weather-rain { fill: none; stroke: #a9e4ff; stroke-width: 5; stroke-linecap: round; }
.weather-lightning { fill: #ffdc72; stroke: #ffdc72; stroke-linejoin: round; }
.weather-snow { fill: #e6f8ff; stroke: #c5efff; stroke-width: 1; }
.weather-fog { fill: none; stroke: #eff8fc; stroke-width: 5; stroke-linecap: round; opacity: .85; }
.weather-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 20px 0; }
.weather-metrics > div { min-width: 0; padding: 12px; border: 1px solid var(--weather-panel-border, var(--app-border)); border-radius: 12px; background: var(--weather-panel, var(--app-surface)); }
.weather-metrics dt { color: var(--weather-muted, var(--app-muted)); font-size: 13px; }
.weather-metrics dd { margin: 4px 0 0; color: var(--weather-text, var(--ion-text-color)); font-weight: 700; }
.weather-forecast { margin-top: 22px; }
.weather-forecast-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.weather-forecast-heading h3 { margin: 0; color: var(--weather-text, var(--app-heading)); font-size: 16px; font-weight: 750; }
.weather-forecast-heading > span { color: var(--weather-muted, var(--app-muted)); font-size: 12px; }
.weather-forecast-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
.forecast-day-card { min-width: 0; padding: 12px 8px; border: 1px solid var(--weather-panel-border, var(--app-border)); border-radius: 14px; background: var(--weather-panel, var(--app-surface)); text-align: center; }
.forecast-date { display: block; color: var(--weather-text, var(--app-heading)); font-size: 12px; font-weight: 750; white-space: nowrap; }
.forecast-icon { display: block; width: 52px; height: 40px; margin: 8px auto; }
.forecast-condition { display: block; min-height: 30px; color: var(--weather-muted, var(--app-muted)); font-size: 11px; line-height: 1.35; }
.forecast-temperatures { display: flex; justify-content: center; gap: 8px; margin-top: 8px; font-size: 14px; }
.forecast-temperatures strong { color: var(--weather-text, var(--app-heading)); }
.forecast-temperatures span { color: var(--weather-muted, var(--app-muted)); }
.forecast-rain-chance { display: block; margin-top: 7px; color: var(--weather-muted, var(--app-muted)); font-size: 10px; white-space: nowrap; }
.weather-time, .weather-note, .weather-credit { font-size: 13px; line-height: 1.5; margin: 6px 0 0; }
.weather-card .muted { color: var(--weather-muted, var(--app-muted)); }
.weather-credit a { color: var(--weather-text, var(--app-accent)); text-underline-offset: 3px; }
@media (max-width: 360px) { .weather-hero { padding: 14px; } .weather-condition { font-size: 16px; } .forecast-day-card { padding: 10px 5px; } .forecast-date { font-size: 11px; } }
@media (prefers-reduced-motion: reduce) { .weather-card { transition: none; } }
@media (min-width: 600px) { .weather-metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
</style>
