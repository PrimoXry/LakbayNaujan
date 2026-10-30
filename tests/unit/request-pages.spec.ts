import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { supabase } from '@/lib/supabase';
import { destinationForUser } from '@/lib/auth';
import SignupPage from '@/views/SignupPage.vue';
import VerifyEmailPage from '@/views/VerifyEmailPage.vue';
import AdminPage from '@/views/AdminPage.vue';

const routing = vi.hoisted(() => ({ replace: vi.fn(), route: { query: { email: 'visitor@example.com' } } }));
vi.mock('vue-router', () => ({ useRouter: () => routing, useRoute: () => routing.route }));
vi.mock('@/lib/auth', () => ({ destinationForUser: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: {
  auth: { signUp: vi.fn(), resend: vi.fn(), verifyOtp: vi.fn(), getUser: vi.fn(), signOut: vi.fn() },
  from: vi.fn(),
  storage: { from: vi.fn() },
} }));
vi.mock('@ionic/vue', async () => {
  const { defineComponent, h, onMounted } = await import('vue');
  const container = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) });
  const input = defineComponent({
    props: ['modelValue', 'disabled', 'type'], emits: ['update:modelValue'],
    setup: (props, { emit }) => () => h('input', {
      value: props.modelValue, disabled: props.disabled, type: props.type || 'text',
      onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
    }),
  });
  const button = defineComponent({
    props: { disabled: Boolean, type: { type: String, default: 'button' } },
    setup: (props, { slots }) => () => h('button', { disabled: props.disabled, type: props.type }, slots.default?.()),
  });
  const modal = defineComponent({
    props: ['isOpen'],
    setup: (props, { slots }) => () => props.isOpen ? h('div', { role: 'dialog' }, slots.default?.()) : null,
  });
  return {
    ...Object.fromEntries(['IonPage', 'IonHeader', 'IonToolbar', 'IonTitle', 'IonButtons', 'IonContent', 'IonSelect', 'IonSelectOption', 'IonSplitPane', 'IonMenu', 'IonList', 'IonItem', 'IonLabel', 'IonIcon', 'IonFooter', 'IonMenuButton', 'IonGrid', 'IonRow', 'IonCol', 'IonCard', 'IonCardHeader', 'IonCardSubtitle', 'IonCardTitle', 'IonCardContent', 'IonBadge', 'IonPopover'].map(name => [name, container])),
    IonInput: input, IonTextarea: input, IonButton: button, IonSearchbar: input, IonModal: modal,
    onIonViewWillEnter: onMounted, onIonViewDidLeave: vi.fn(),
  };
});

let wrapper: VueWrapper | undefined;
let emailIndex = 0;
const options = { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } };
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  routing.route.query.email = `visitor-${++emailIndex}@example.com`;
  routing.replace.mockResolvedValue(undefined);
});
afterEach(() => { wrapper?.unmount(); wrapper = undefined; vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('signup and verification screens', () => {
  it('requests signup once and opens verification without sending a second email', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: { user: { id: 'user-1' }, session: null }, error: null } as never);
    wrapper = mount(SignupPage, options);
    await wrapper.get('#signup-username').setValue('visitor_1');
    await wrapper.get('#signup-email').setValue(' Visitor@Example.com ');
    await wrapper.get('#signup-password').setValue('test-password-123');
    await wrapper.get('#signup-confirm').setValue('test-password-123');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(supabase.auth.signUp).toHaveBeenCalledTimes(1);
    expect(routing.replace).toHaveBeenCalledWith({ path: '/verify', query: { email: 'visitor@example.com' } });
    expect(supabase.auth.resend).not.toHaveBeenCalled();
  });

  it('does not send email just by opening verification and displays resend failures', async () => {
    wrapper = mount(VerifyEmailPage, options);
    expect(supabase.auth.resend).not.toHaveBeenCalled();
    vi.mocked(supabase.auth.resend).mockResolvedValue({ data: { user: null, session: null }, error: { code: 'email_address_not_authorized' } } as never);
    await wrapper.get('.resend-button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Email delivery is not enabled for this address');
    expect(wrapper.text()).not.toContain('Request accepted');
  });

  it('does not label a profile fetch failure as a failed OTP verification', async () => {
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({ data: { user: { id: 'user-1' }, session: { access_token: 'test' } }, error: null } as never);
    vi.mocked(destinationForUser).mockRejectedValue({ message: 'Profile is unavailable' });
    wrapper = mount(VerifyEmailPage, options);
    await wrapper.get('[autocomplete="one-time-code"]').setValue('123456');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Your email is verified');
    expect(wrapper.text()).toContain('Profile is unavailable');
    expect(routing.replace).not.toHaveBeenCalled();
  });
});

describe('admin partial saves', () => {
  it('uploads multiple photos, saves their order, and removes/reorders persisted gallery entries', async () => {
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL(file: File) { return `blob:${file.name}`; }
      static revokeObjectURL = vi.fn();
    });
    const storedPhotos = ['https://photos.example/old.png'];
    const spot = { id: 'spot-1', name: 'Test lake', category: 'Nature', description: 'Description', address: 'Test address',
      latitude: null, longitude: null, image_url: storedPhotos[0], image_urls: storedPhotos, bucket_list: [] };
    const updateSpot = vi.fn<(payload: { image_urls: string[]; image_url: string }) => unknown>(() => ({ eq: () => ({ select: () => ({ single: async () => ({ data: { id: 'spot-1' }, error: null }) }) }) }));
    vi.mocked(supabase.from).mockImplementation(((table: string) => table === 'tourist_spots' ? {
      select: () => ({ order: async () => ({ data: [spot], error: null }) }), update: updateSpot,
    } : {
      select: (columns: string) => columns === 'id'
        ? { eq: async () => ({ count: 3, error: null }) }
        : { eq: () => ({ order: async () => ({ data: [], error: null }) }) },
      delete: () => ({ eq: async () => ({ error: null }) }),
    }) as never);
    const bucket = { upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://photos.example/${path}` } })) };
    vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null } as never);
    wrapper = mount(AdminPage, options);
    await flushPromises();
    expect(wrapper.get('#midbox2 .stat-value').text()).toBe('3');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    await wrapper.get('[aria-label="Search destinations"]').setValue('no matching destination');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.get('tbody').text()).not.toContain('Test lake');
    await wrapper.get('[aria-label="Search destinations"]').setValue('lake');
    expect(wrapper.get('tbody').text()).toContain('Test lake');
    await wrapper.findAll('button').find(button => button.text() === 'Edit')!.trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.get('.photo-draft img').attributes('src')).toBe(storedPhotos[0]);
    const input = wrapper.get('#spot-photos');
    Object.defineProperty(input.element, 'files', { configurable: true, value: [
      new File(['one'], 'one.png', { type: 'image/png' }), new File(['two'], 'two.jpg', { type: 'image/jpeg' }),
    ] });
    await input.trigger('change');
    expect(wrapper.findAll('.photo-draft')).toHaveLength(3);
    await wrapper.get('[aria-label="Remove photo 1"]').trigger('click');
    await wrapper.get('[aria-label="Move photo 2 earlier"]').trigger('click');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    const payload = updateSpot.mock.calls[0][0];
    expect(payload.image_urls).toHaveLength(2);
    expect(payload.image_urls[0]).toMatch(/\.jpg$/);
    expect(payload.image_urls[1]).toMatch(/\.png$/);
    expect(payload.image_url).toBe(payload.image_urls[0]);
    expect(bucket.upload).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('Tourist spot saved successfully');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('retries the existing destination after nearby-place insertion fails', async () => {
    const insertSpot = vi.fn(() => ({ select: () => ({ single: async () => ({ data: { id: 'spot-1' }, error: null }) }) }));
    const updateSpot = vi.fn(() => ({ eq: () => ({ select: () => ({ single: async () => ({ data: { id: 'spot-1' }, error: null }) }) }) }));
    const insertNearby = vi.fn()
      .mockResolvedValueOnce({ error: { message: 'Nearby save unavailable' } })
      .mockResolvedValueOnce({ error: null });
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null } as never);
    vi.mocked(supabase.from).mockImplementation(((table: string) => table === 'tourist_spots' ? {
      select: () => ({ order: async () => ({ data: [], error: null }) }), insert: insertSpot, update: updateSpot,
    } : {
      delete: () => ({ eq: async () => ({ error: null }) }), insert: insertNearby,
    }) as never);
    wrapper = mount(AdminPage, options);
    await flushPromises();
    await wrapper.get('[aria-label="Add tourist spot"]').trigger('click');
    await wrapper.get('[placeholder="Naujan Lake"]').setValue('Test lake');
    await wrapper.get('[placeholder="History, highlights, travel tips..."]').setValue('Test description');
    await wrapper.get('[placeholder="Naujan, Oriental Mindoro"]').setValue('Test address');
    await wrapper.findAll('button').find(button => button.text().includes('Add nearby establishment'))!.trigger('click');
    await wrapper.get('[placeholder="Store or carinderia name"]').setValue('Test store');
    await wrapper.get('[placeholder="Address in Naujan"]').setValue('Test nearby address');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('The destination was saved, but nearby places could not be fully updated');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(insertSpot).toHaveBeenCalledTimes(1);
    expect(updateSpot).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('Tourist spot saved successfully');
  });
});
