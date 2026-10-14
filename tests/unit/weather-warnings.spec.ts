import { describe, expect, it } from 'vitest';
import { weatherWarnings } from '@/lib/weatherWarnings';
import { weatherCondition } from '@/lib/weather';

describe('bad-weather advisories', () => {
  it('does not invent warnings from missing, unknown, clear or cloudy conditions', () => {
    expect(weatherWarnings(null)).toEqual([]);
    for (const weatherCode of [null, 0, 1, 2, 3, 999, NaN]) {
      expect(weatherWarnings({ weatherCode, windSpeed: null })).toEqual([]);
    }
  });

  it.each([95, 96, 97, 99])('warns about thunderstorm code %s even with no rain total or wind data', weatherCode => {
    expect(weatherWarnings({ weatherCode, windSpeed: null })).toEqual([
      expect.objectContaining({ title: 'Thunderstorms', severity: 'warning' }),
    ]);
    expect(weatherCondition(weatherCode, true).label.toLowerCase()).toContain('thunderstorm');
  });

  it.each([65, 82])('warns about heavy rain code %s', weatherCode => {
    expect(weatherWarnings({ weatherCode, windSpeed: 0 })).toEqual([
      expect.objectContaining({ title: 'Heavy rain', severity: 'warning' }),
    ]);
  });

  it('distinguishes ordinary rain and fog cautions from severe warnings', () => {
    for (const weatherCode of [51, 53, 55, 61, 63, 80, 81, 45, 48]) {
      const warnings = weatherWarnings({ weatherCode, windSpeed: 10 });
      expect(warnings).toHaveLength(1);
      expect(warnings[0].severity).toBe('caution');
    }
  });

  it('covers freezing precipitation and snow without confusing them with ordinary rain', () => {
    for (const weatherCode of [56, 57, 66, 67, 71, 73, 75, 77, 85, 86]) {
      expect(weatherWarnings({ weatherCode, windSpeed: 10 })).toEqual([
        expect.objectContaining({ title: 'Snow or freezing precipitation', severity: 'warning' }),
      ]);
    }
  });

  it('applies inclusive wind thresholds in km/h, independently of the condition code', () => {
    for (const windSpeed of [null, 0, -1, NaN, Infinity, 39.9]) {
      expect(weatherWarnings({ weatherCode: null, windSpeed })).toEqual([]);
    }
    for (const windSpeed of [40, 59.9]) {
      expect(weatherWarnings({ weatherCode: null, windSpeed })).toEqual([
        expect.objectContaining({ id: 'wind', severity: 'caution' }),
      ]);
    }
    expect(weatherWarnings({ weatherCode: 0, windSpeed: 60 })).toEqual([
      expect.objectContaining({ id: 'wind', severity: 'warning', message: expect.stringContaining('60.0 km/h') }),
    ]);
  });

  it('keeps simultaneous conditions and wind warnings visible', () => {
    const warnings = weatherWarnings({ weatherCode: 95, windSpeed: 45 });
    expect(warnings).toHaveLength(2);
    expect(warnings.map(warning => warning.id)).toEqual(['conditions', 'wind']);
    expect(warnings.map(warning => warning.severity)).toEqual(['warning', 'caution']);
  });
});
