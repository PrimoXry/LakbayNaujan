import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ProfileAvatar from '@/components/ProfileAvatar.vue';

describe('profile avatar', () => {
  it('falls back to initials when a picture fails and retries a replacement picture', async () => {
    const wrapper = mount(ProfileAvatar, { props: { name: 'Maria Cruz', src: 'https://example.com/old.png' } });
    await wrapper.get('img').trigger('error');
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.text()).toBe('MC');
    await wrapper.setProps({ src: 'https://example.com/new.png' });
    expect(wrapper.get('img').attributes('src')).toBe('https://example.com/new.png');
    wrapper.unmount();
  });
});
