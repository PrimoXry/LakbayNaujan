import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import SpotImageSlider from '@/components/SpotImageSlider.vue';

vi.mock('@/lib/supabase', () => ({ supabase: {} }));
let wrapper: VueWrapper;
const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
});
afterEach(() => {
  wrapper?.unmount();
  if (originalScrollTo) Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
});

describe('destination image slider', () => {
  it('shows an empty placeholder and hides controls for a single legacy image', async () => {
    wrapper = mount(SpotImageSlider, { props: { name: 'Naujan Lake' } });
    expect(wrapper.text()).toContain('No photos yet');
    expect(wrapper.findAll('button')).toHaveLength(0);
    await wrapper.setProps({ imageUrl: 'cover.png' });
    expect(wrapper.get('img').attributes('src')).toBe('cover.png');
    expect(wrapper.findAll('button')).toHaveLength(0);
    await wrapper.get('img').trigger('error');
    expect(wrapper.text()).toContain('Photo unavailable');
  });

  it('navigates database pictures using arrows, dots, and keyboard, and wraps at the ends', async () => {
    wrapper = mount(SpotImageSlider, { props: { name: 'Lake', imageUrls: ['one.png', 'two.png', 'three.png'] } });
    const track = wrapper.get('.photo-track').element;
    Object.defineProperty(track, 'clientWidth', { value: 320 });
    expect(wrapper.findAll('img').map(img => img.attributes('src'))).toEqual(['one.png', 'two.png', 'three.png']);
    await wrapper.get('[aria-label="Next photo of Lake"]').trigger('click');
    expect(wrapper.get('.photo-count').text()).toBe('2 / 3');
    expect(track.scrollTo).toHaveBeenCalledWith({ left: 320, behavior: 'smooth' });
    await wrapper.get('[aria-label="Show photo 3 of Lake"]').trigger('click');
    await wrapper.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.get('.photo-count').text()).toBe('1 / 3');
    await wrapper.get('[aria-label="Previous photo of Lake"]').trigger('click');
    expect(wrapper.get('.photo-count').text()).toBe('3 / 3');
    await wrapper.trigger('keydown', { key: 'ArrowLeft' });
    expect(wrapper.get('[aria-current="true"]').attributes('aria-label')).toBe('Show photo 2 of Lake');
  });

  it('updates the counter when swiped and resets when a different gallery is loaded', async () => {
    wrapper = mount(SpotImageSlider, { props: { name: 'Lake', imageUrls: ['one.png', 'two.png'] } });
    const track = wrapper.get('.photo-track').element;
    Object.defineProperty(track, 'clientWidth', { value: 320 });
    track.scrollLeft = 320;
    await wrapper.get('.photo-track').trigger('scroll');
    expect(wrapper.get('.photo-count').text()).toBe('2 / 2');
    await wrapper.setProps({ name: 'Park', imageUrls: ['park.png', 'trail.png', 'trees.png'] });
    expect(wrapper.get('.photo-count').text()).toBe('1 / 3');
    expect(track.scrollLeft).toBe(0);
  });
});
