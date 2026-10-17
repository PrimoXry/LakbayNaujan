import type { CurrentWeather } from './weather';

export type WeatherWarning = {
  id: 'conditions' | 'wind';
  severity: 'caution' | 'warning';
  title: string;
  message: string;
};

// App advisory thresholds, not PAGASA tropical cyclone warning signals.
const WIND_CAUTION_KMH = 40;
const WIND_WARNING_KMH = 60;

export function weatherWarnings(weather: Pick<CurrentWeather, 'weatherCode' | 'windSpeed'> | null): WeatherWarning[] {
  if (!weather) return [];
  const warnings: WeatherWarning[] = [];
  const code = weather.weatherCode;
  if (code !== null) {
    if ([95, 96, 97, 99].includes(code)) {
      warnings.push({
        id: 'conditions', severity: 'warning', title: 'Thunderstorms',
        message: 'Thunderstorms are indicated near this destination. Consider postponing outdoor activities.',
      });
    } else if ([65, 82].includes(code)) {
      warnings.push({
        id: 'conditions', severity: 'warning', title: 'Heavy rain',
        message: 'Heavy rain or intense showers are indicated. Travel and outdoor plans may be disrupted.',
      });
    } else if ([51, 53, 55, 61, 63, 80, 81].includes(code)) {
      warnings.push({
        id: 'conditions', severity: 'caution', title: 'Rain or drizzle',
        message: 'Rain or drizzle is indicated. Plan for wet paths and changing conditions.',
      });
    } else if ([45, 48].includes(code)) {
      warnings.push({
        id: 'conditions', severity: 'caution', title: 'Fog',
        message: 'Fog is indicated near this destination. Visibility may be reduced.',
      });
    } else if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) {
      warnings.push({
        id: 'conditions', severity: 'warning', title: 'Snow or freezing precipitation',
        message: 'Snow or freezing precipitation is indicated. Travel conditions may be difficult.',
      });
    }
  }
  const wind = weather.windSpeed;
  if (wind !== null && Number.isFinite(wind) && wind >= WIND_CAUTION_KMH) {
    warnings.push({
      id: 'wind', severity: wind >= WIND_WARNING_KMH ? 'warning' : 'caution', title: 'Strong winds',
      message: `Estimated wind: ${wind.toFixed(1)} km/h. Exposed outdoor activities may be affected.`,
    });
  }
  // No warning is not an assurance that a destination is safe to visit.
  return warnings;
}
