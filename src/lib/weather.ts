// Open-Meteo Forecast API: https://open-meteo.com/en/docs
export type CurrentWeather = {
  time: number;
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  precipitation: number | null;
  windSpeed: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
};

const CACHE_MS = 15 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; weather: CurrentWeather }>();
const pending = new Map<string, Promise<CurrentWeather>>();

export function hasWeatherCoordinates(latitude: number | null, longitude: number | null): boolean {
  return typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

function measurement(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function requestWeather(latitude: number, longitude: number): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day',
    temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm',
    timezone: 'Asia/Manila', timeformat: 'unixtime',
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    let response: Response;
    try {
      response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal });
    } catch {
      throw new Error(controller.signal.aborted
        ? 'The weather request took too long. Please try again.'
        : 'Could not load weather. Check your internet connection and try again.');
    }
    if (!response.ok) {
      throw new Error(response.status === 429
        ? 'The weather service is busy. Please try again in a few minutes.'
        : 'Weather is temporarily unavailable. Please try again later.');
    }
    let body: unknown;
    try { body = await response.json(); }
    catch { throw new Error('The weather service returned incomplete data. Please try again later.'); }
    const current = record(record(body).current);
    const time = measurement(current.time);
    if (time === null || !Number.isFinite(new Date(time * 1000).getTime())
      || !['temperature_2m', 'weather_code', 'relative_humidity_2m', 'precipitation', 'wind_speed_10m']
        .some(key => measurement(current[key]) !== null)) {
      throw new Error('Weather data is unavailable for this location. Please try again later.');
    }
    return {
      time,
      temperature: measurement(current.temperature_2m),
      feelsLike: measurement(current.apparent_temperature),
      humidity: measurement(current.relative_humidity_2m),
      precipitation: measurement(current.precipitation),
      windSpeed: measurement(current.wind_speed_10m),
      weatherCode: measurement(current.weather_code),
      isDay: current.is_day === 1 ? true : current.is_day === 0 ? false : null,
    };
  } finally { clearTimeout(timeout); }
}

export async function getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeather> {
  if (!hasWeatherCoordinates(latitude, longitude)) throw new Error('This destination needs a valid map location to show weather.');
  const key = `${latitude},${longitude}`;
  const now = Date.now();
  for (const [cachedKey, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(cachedKey);
  }
  const cached = cache.get(key);
  if (cached) return cached.weather;
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const request = requestWeather(latitude, longitude).then(weather => {
    cache.set(key, { weather, expiresAt: Date.now() + CACHE_MS });
    return weather;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

// WMO codes from Open-Meteo. Unknown or missing codes must not imply clear skies.
const conditions: Record<number, [string, string]> = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Depositing rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Moderate drizzle', '🌦️'], 55: ['Dense drizzle', '🌧️'],
  56: ['Light freezing drizzle', '🌧️'], 57: ['Dense freezing drizzle', '🌧️'],
  61: ['Slight rain', '🌧️'], 63: ['Moderate rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Light freezing rain', '🌧️'], 67: ['Heavy freezing rain', '🌧️'],
  71: ['Slight snowfall', '🌨️'], 73: ['Moderate snowfall', '🌨️'], 75: ['Heavy snowfall', '🌨️'], 77: ['Snow grains', '🌨️'],
  80: ['Slight rain showers', '🌦️'], 81: ['Moderate rain showers', '🌧️'], 82: ['Violent rain showers', '🌧️'],
  85: ['Slight snow showers', '🌨️'], 86: ['Heavy snow showers', '🌨️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with slight hail', '⛈️'],
  97: ['Heavy thunderstorm', '⛈️'], 99: ['Thunderstorm with heavy hail', '⛈️'],
};

export function weatherCondition(code: number | null, isDay: boolean | null): { label: string; icon: string } {
  const [label, icon] = (code === null ? undefined : conditions[code]) ?? ['Conditions unavailable', '🌡️'];
  return { label, icon: isDay === false && (code === 0 || code === 1) ? '🌙' : icon };
}
