import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const responseBody = () => ({ current: {
  time: 1791950400, temperature_2m: 29.4, apparent_temperature: 33.2,
  relative_humidity_2m: 78, precipitation: 0, weather_code: 2, wind_speed_10m: 6.8, is_day: 1,
} });
const response = (body: unknown = responseBody(), status = 200) => ({
  ok: status === 200, status, json: async () => body,
});
let weather: typeof import('@/lib/weather');
const fetchMock = vi.fn();

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-14T04:00:00Z'));
  fetchMock.mockReset().mockResolvedValue(response());
  vi.stubGlobal('fetch', fetchMock);
  weather = await import('@/lib/weather');
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('destination weather requests', () => {
  it('uses the saved coordinates and explicit units, preserving the API timestamp', async () => {
    const result = await weather.getCurrentWeather(13.323456, 121.302345);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('13.323456');
    expect(url.searchParams.get('longitude')).toBe('121.302345');
    expect(url.searchParams.get('timezone')).toBe('Asia/Manila');
    expect(url.searchParams.get('timeformat')).toBe('unixtime');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('current')).toContain('weather_code');
    expect(result).toEqual({
      time: 1791950400, temperature: 29.4, feelsLike: 33.2, humidity: 78,
      precipitation: 0, weatherCode: 2, windSpeed: 6.8, isDay: true,
    });
  });

  it('accepts zero and negative coordinates but never requests missing or invalid locations', async () => {
    expect(weather.hasWeatherCoordinates(null, 121)).toBe(false);
    expect(weather.hasWeatherCoordinates(13, null)).toBe(false);
    for (const [lat, lon] of [[91, 121], [13, 181], [NaN, 121], [13, Infinity]]) {
      await expect(weather.getCurrentWeather(lat, lon)).rejects.toThrow('valid map location');
    }
    expect(fetchMock).not.toHaveBeenCalled();
    await weather.getCurrentWeather(0, 0);
    await weather.getCurrentWeather(-13.32, -121.3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shares simultaneous requests, caches by coordinates and refetches after 15 minutes', async () => {
    await Promise.all([weather.getCurrentWeather(13.3, 121.3), weather.getCurrentWeather(13.3, 121.3)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    await weather.getCurrentWeather(13.3, 121.3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await weather.getCurrentWeather(13.4, 121.3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(60 * 1000);
    await weather.getCurrentWeather(13.3, 121.3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([[429, 'busy'], [503, 'temporarily unavailable']])('allows retry after HTTP %s', async (status, message) => {
    fetchMock.mockResolvedValueOnce(response({}, status as number));
    await expect(weather.getCurrentWeather(13.3, 121.3)).rejects.toThrow(String(message));
    await expect(weather.getCurrentWeather(13.3, 121.3)).resolves.toHaveProperty('temperature', 29.4);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('handles a network failure without caching it', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(weather.getCurrentWeather(13.3, 121.3)).rejects.toThrow('internet connection');
    await expect(weather.getCurrentWeather(13.3, 121.3)).resolves.toHaveProperty('temperature', 29.4);
  });

  it('aborts a stalled request and allows another attempt', async () => {
    fetchMock.mockImplementationOnce((_url, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const outcome = expect(weather.getCurrentWeather(13.3, 121.3)).rejects.toThrow('took too long');
    await vi.advanceTimersByTimeAsync(12000);
    await outcome;
    await expect(weather.getCurrentWeather(13.3, 121.3)).resolves.toHaveProperty('temperature', 29.4);
  });

  it.each([{}, { current: { time: 1791950400 } }, { current: { temperature_2m: 29 } }])(
    'rejects incomplete responses instead of showing invented conditions', async body => {
      fetchMock.mockResolvedValueOnce(response(body));
      await expect(weather.getCurrentWeather(13.3, 121.3)).rejects.toThrow('unavailable for this location');
    },
  );

  it('keeps missing measurements distinct from zero and unknown conditions distinct from clear skies', async () => {
    fetchMock.mockResolvedValue(response({ current: { ...responseBody().current, temperature_2m: null, weather_code: null, is_day: null } }));
    const result = await weather.getCurrentWeather(13.3, 121.3);
    expect(result.temperature).toBeNull();
    expect(result.precipitation).toBe(0);
    expect(weather.weatherCondition(result.weatherCode, result.isDay).label).toBe('Conditions unavailable');
    expect(weather.weatherCondition(999, true).label).toBe('Conditions unavailable');
    expect(weather.weatherCondition(0, false)).toEqual({ label: 'Clear sky', icon: '🌙' });
    expect(weather.weatherCondition(95, true).label).toBe('Thunderstorm');
  });
});
