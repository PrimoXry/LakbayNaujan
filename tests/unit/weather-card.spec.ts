import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import WeatherCard from '@/components/WeatherCard.vue';
import { getCurrentWeather, type CurrentWeather } from '@/lib/weather';

vi.mock('@/lib/weather', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/weather')>(), getCurrentWeather: vi.fn(),
}));
vi.mock('@ionic/vue', async () => {
  const { defineComponent, h } = await import('vue');
  return { IonButton: defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) }) };
});

const sample: CurrentWeather = {
  time: Date.parse('2026-10-14T04:00:00Z') / 1000, temperature: 29.4, feelsLike: 33.2,
  humidity: 78, precipitation: 0, windSpeed: 6.8, weatherCode: 2, isDay: true,
};
let wrapper: VueWrapper | undefined;
beforeEach(() => { vi.mocked(getCurrentWeather).mockReset().mockResolvedValue(sample); });
afterEach(() => { wrapper?.unmount(); wrapper = undefined; });

describe('destination weather card', () => {
  it('does not request weather without both valid coordinates', async () => {
    wrapper = mount(WeatherCard, { props: { spotName: 'Test lake', latitude: null, longitude: 121.3 } });
    await flushPromises();
    expect(wrapper.text()).toContain('Weather unavailable');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(getCurrentWeather).not.toHaveBeenCalled();
    await wrapper.setProps({ latitude: 100 });
    expect(getCurrentWeather).not.toHaveBeenCalled();
  });

  it('shows loading, weather units, condition, Philippine time and attribution', async () => {
    wrapper = mount(WeatherCard, { props: { spotName: 'Test lake', latitude: 13.3, longitude: 121.3 } });
    expect(wrapper.text()).toContain('Loading weather');
    await flushPromises();
    expect(getCurrentWeather).toHaveBeenCalledWith(13.3, 121.3);
    expect(wrapper.text()).toContain('29.4 °C');
    expect(wrapper.text()).toContain('78%');
    expect(wrapper.text()).toContain('6.8 km/h');
    expect(wrapper.text()).toContain('Partly cloudy');
    expect(wrapper.get('time').text().toLowerCase()).toContain('12:00 pm');
    expect(wrapper.get('time').attributes('datetime')).toBe('2026-10-14T04:00:00.000Z');
    expect(wrapper.get('a').attributes('href')).toBe('https://open-meteo.com/');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('recovers from a failed request with the retry button', async () => {
    vi.mocked(getCurrentWeather).mockRejectedValueOnce(new Error('Weather is temporarily unavailable.'));
    wrapper = mount(WeatherCard, { props: { spotName: 'Test lake', latitude: 13.3, longitude: 121.3 } });
    await flushPromises();
    expect(wrapper.text()).toContain('temporarily unavailable');
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('29.4 °C');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('ignores a late response for the previous destination', async () => {
    let resolvePrevious!: (value: CurrentWeather) => void;
    vi.mocked(getCurrentWeather).mockImplementationOnce(() => new Promise(resolve => { resolvePrevious = resolve; }));
    wrapper = mount(WeatherCard, { props: { spotName: 'Test lake', latitude: 13.3, longitude: 121.3 } });
    await wrapper.setProps({ spotName: 'Test park', latitude: 13.4 });
    await flushPromises();
    resolvePrevious({ ...sample, temperature: 11, weatherCode: 95 });
    await flushPromises();
    expect(wrapper.text()).toContain('29.4 °C');
    expect(wrapper.text()).not.toContain('11 °C');
    expect(wrapper.get('h2').text()).toBe('Current weather at Test park');
    expect(wrapper.text()).not.toContain('Test lake');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('discards pending weather when the location is removed', async () => {
    let resolveWeather!: (value: CurrentWeather) => void;
    vi.mocked(getCurrentWeather).mockImplementationOnce(() => new Promise(resolve => { resolveWeather = resolve; }));
    wrapper = mount(WeatherCard, { props: { spotName: 'Test lake', latitude: 13.3, longitude: 121.3 } });
    await wrapper.setProps({ latitude: null, longitude: null });
    resolveWeather(sample);
    await flushPromises();
    expect(wrapper.text()).toContain('Weather unavailable');
    expect(wrapper.text()).not.toContain('29.4');
  });

  it('shows a dash for missing values instead of zero', async () => {
    vi.mocked(getCurrentWeather).mockResolvedValue({ ...sample, temperature: null, humidity: null });
    wrapper = mount(WeatherCard, { props: { spotName: 'Test lake', latitude: 13.3, longitude: 121.3 } });
    await flushPromises();
    expect(wrapper.text()).toContain('— °C');
    expect(wrapper.text()).toContain('—%');
    expect(wrapper.text()).toContain('0 mm');
  });

  it('shows a persistent accessible warning with simultaneous hazards and official-update link', async () => {
    vi.mocked(getCurrentWeather).mockResolvedValue({ ...sample, weatherCode: 95, windSpeed: 45 });
    wrapper = mount(WeatherCard, { props: { spotName: 'Test lake', latitude: 13.3, longitude: 121.3 } });
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    await flushPromises();
    const warning = wrapper.get('[role="alert"]');
    expect(warning.text()).toContain('Bad weather warning for Test lake');
    expect(warning.text()).toContain('Thunderstorms');
    expect(warning.text()).toContain('45.0 km/h');
    expect(warning.text()).toContain('App advisory based on estimated weather');
    expect(warning.classes()).toContain('weather-warning-severe');
    expect(warning.get('a').attributes('href')).toBe('https://www.pagasa.dost.gov.ph/');
    expect(wrapper.text()).toContain('As of');
  });

  it('shows a caution for rain without labelling it severe', async () => {
    vi.mocked(getCurrentWeather).mockResolvedValue({ ...sample, weatherCode: 61 });
    wrapper = mount(WeatherCard, { props: { spotName: 'Test lake', latitude: 13.3, longitude: 121.3 } });
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('Weather caution');
    expect(wrapper.get('[role="alert"]').classes()).not.toContain('weather-warning-severe');
  });

  it('removes the previous warning if the next destination weather request fails', async () => {
    vi.mocked(getCurrentWeather)
      .mockResolvedValueOnce({ ...sample, weatherCode: 65 })
      .mockRejectedValueOnce(new Error('Weather is temporarily unavailable.'));
    wrapper = mount(WeatherCard, { props: { spotName: 'Test lake', latitude: 13.3, longitude: 121.3 } });
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('Heavy rain');
    await wrapper.setProps({ latitude: 13.4 });
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('temporarily unavailable');
    expect(wrapper.get('button').text()).toBe('Retry weather');
  });

  it('evaluates each named destination separately when multiple spot cards are mounted', async () => {
    vi.mocked(getCurrentWeather).mockImplementation(async (latitude, longitude) => ({
      ...sample, weatherCode: latitude === 13.3 && longitude === 121.3 ? 65 : 0,
    }));
    wrapper = mount({
      components: { WeatherCard },
      template: `<div>
        <WeatherCard spot-name="Test lake" :latitude="13.3" :longitude="121.3" />
        <WeatherCard spot-name="Test park" :latitude="13.4" :longitude="121.4" />
      </div>`,
    });
    await flushPromises();
    const cards = wrapper.findAllComponents(WeatherCard);
    expect(getCurrentWeather).toHaveBeenCalledWith(13.3, 121.3);
    expect(getCurrentWeather).toHaveBeenCalledWith(13.4, 121.4);
    expect(cards[0].get('[role="alert"]').text()).toContain('Bad weather warning for Test lake');
    expect(cards[0].get('[role="alert"]').text()).toContain('Heavy rain');
    expect(cards[1].find('[role="alert"]').exists()).toBe(false);
    expect(cards[1].text()).toContain('Current weather at Test park');
    expect(cards[1].text()).toContain('Clear sky');
    expect(cards[1].text()).not.toContain('Test lake');
  });
});
