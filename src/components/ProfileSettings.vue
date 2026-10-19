<template>
  <div class="settings-layout">
    <section class="account-panel profile-card">
      <ProfileAvatar :name="profile.display_name || profile.username" :src="avatarPreviewUrl" large />
      <div class="profile-identity">
        <h2>{{ profile.display_name || profile.username }}</h2>
        <p class="profile-username">@{{ profile.username }}</p>
        <p v-if="!passwordLogin" class="profile-provider">Google account</p>
        <p class="account-email">{{ email }}</p>
      </div>
      <button type="button" class="ui-button ui-button-secondary" :disabled="!!busy" aria-controls="picture-picker-options" :aria-expanded="picturePickerOpen" @click="togglePicturePicker">{{ picturePickerOpen ? 'Cancel' : 'Change picture' }}</button>
      <input id="profile-photo" ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden :disabled="!!busy" @change="choosePhoto" />
      <div v-if="picturePickerOpen" id="picture-picker-options" class="picture-picker">
        <p class="settings-hint">Choose where to get your profile picture.</p>
        <div class="picture-source-options" role="group" aria-label="Profile picture source">
          <button type="button" class="ui-button ui-button-secondary" :disabled="!!busy" :aria-expanded="presetPickerOpen" @click="presetPickerOpen = true">Default pictures</button>
          <button type="button" class="ui-button ui-button-secondary" :disabled="!!busy" @click="openAlbum">Get from album</button>
        </div>
        <div v-if="presetPickerOpen" class="avatar-options" role="group" aria-label="Default avatar stickers">
          <button v-for="preset in avatarPresets" :key="preset.id" type="button" class="avatar-choice"
            :class="{ 'avatar-choice-selected': selectedPreset === preset.id }"
            :aria-pressed="selectedPreset === preset.id" :aria-label="`Select ${preset.label} avatar sticker`"
            :title="preset.label" :disabled="!!busy" @click="choosePreset(preset.id)">
            <img :src="avatarPresetUrl(preset.id)" :alt="`${preset.label} illustrated avatar`" />
            <span>{{ preset.label }}</span>
          </button>
        </div>
        <p class="settings-hint photo-hint">JPEG, PNG or WebP · up to 2 MB</p>
        <div v-if="photo" class="photo-actions">
          <button type="button" class="ui-button" :disabled="!!busy" @click="savePhoto">{{ busy === 'avatar' ? 'Uploading…' : 'Save picture' }}</button>
          <button type="button" class="ui-button ui-button-secondary" :disabled="!!busy" @click="clearPhoto">Cancel</button>
        </div>
        <div v-if="presetNeedsSave" class="preset-save-row">
          <p class="settings-hint">Your avatar sticker will be used across your account.</p>
          <button type="button" class="ui-button" :disabled="!!busy" @click="savePreset">{{ busy === 'preset' ? 'Saving…' : 'Use this avatar' }}</button>
        </div>
      </div>
      <p v-if="photoMessage" class="feedback profile-feedback" :class="{ error: photoError }" role="status">{{ photoMessage }}</p>
    </section>

    <section class="account-panel">
      <div class="panel-heading"><h2>Profile details</h2></div>
      <form class="settings-form" @submit.prevent="saveNames">
        <label class="field" for="profile-name">
          <span>Name</span>
          <input id="profile-name" v-model="name" class="account-input" autocomplete="name" required maxlength="80" :disabled="!!busy" />
        </label>
        <label class="field" for="profile-username">
          <span>Username</span>
          <input id="profile-username" v-model="username" class="account-input" autocomplete="username" required minlength="3" maxlength="30" pattern="[A-Za-z0-9_]{3,30}" :disabled="!!busy" />
        </label>
        <p class="settings-hint">3–30 letters, numbers or underscores. Your email stays the same.</p>
        <p v-if="profileMessage" class="feedback" :class="{ error: profileError }" role="status">{{ profileMessage }}</p>
        <button type="submit" class="ui-button" :disabled="!!busy">{{ busy === 'profile' ? 'Saving…' : 'Save profile' }}</button>
      </form>
    </section>

    <section class="account-panel">
      <div class="panel-heading"><h2>Password</h2></div>
      <form v-if="passwordLogin" class="settings-form" @submit.prevent="savePassword">
        <label class="field" for="current-password">
          <span>Current password</span>
          <input id="current-password" v-model="currentPassword" class="account-input" type="password" autocomplete="current-password" required :disabled="!!busy" />
        </label>
        <label class="field" for="new-password">
          <span>New password</span>
          <input id="new-password" v-model="password" class="account-input" type="password" autocomplete="new-password" minlength="8" required :disabled="!!busy" />
        </label>
        <label class="field" for="confirm-password">
          <span>Confirm new password</span>
          <input id="confirm-password" v-model="confirmation" class="account-input" type="password" autocomplete="new-password" minlength="8" required :disabled="!!busy" />
        </label>
        <p class="settings-hint">Use at least 8 characters.</p>
        <p v-if="passwordMessage" class="feedback" :class="{ error: passwordError }" role="status">{{ passwordMessage }}</p>
        <button type="submit" class="ui-button" :disabled="!!busy">{{ busy === 'password' ? 'Updating…' : 'Update password' }}</button>
      </form>
      <p v-else class="settings-hint">You sign in with Google. Manage your password in your Google Account.</p>
    </section>

    <section class="account-panel appearance-setting">
      <div>
        <h2>Appearance</h2>
        <p class="settings-hint">Use dark mode while exploring.</p>
      </div>
      <div class="theme-control">
        <span class="theme-label">Dark mode</span>
        <button type="button" class="theme-switch" role="switch" :aria-checked="darkMode" aria-label="Dark mode" @click="setDarkMode(!darkMode)"><span /></button>
      </div>
    </section>

    <div class="logout-row">
      <p>Log out of your account</p>
      <button type="button" class="ui-button logout-button" :disabled="!!busy || loggingOut" @click="$emit('logout')">{{ loggingOut ? 'Logging out…' : 'Log out' }}</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import ProfileAvatar from './ProfileAvatar.vue';
import { accountError, avatarPresetFromPath, avatarPresetUrl, AVATAR_PRESETS, changePassword, saveAvatarPreset, savePersonalProfile, uploadAvatar, validateAvatar, type AvatarPresetId, type UserProfile } from '../lib/userAccount';
import { darkMode, setDarkMode } from '../lib/theme';
const props = defineProps<{ profile: UserProfile; email: string; avatar: string | null; loggingOut: boolean; passwordLogin: boolean }>();
const emit = defineEmits<{ updated: [profile: UserProfile]; logout: [] }>();
const name = ref(''); const username = ref('');
const currentPassword = ref(''); const password = ref(''); const confirmation = ref('');
const busy = ref(''); const photo = ref<File | null>(null); const previewUrl = ref<string | null>(null);
const picturePickerOpen = ref(false); const presetPickerOpen = ref(false);
const selectedPreset = ref<AvatarPresetId | null>(avatarPresetFromPath(props.profile.avatar_path));
const avatarPreviewUrl = computed(() => previewUrl.value || (selectedPreset.value ? avatarPresetUrl(selectedPreset.value) : props.avatar));
const presetNeedsSave = computed(() => selectedPreset.value !== null && selectedPreset.value !== avatarPresetFromPath(props.profile.avatar_path));
const avatarPresets = AVATAR_PRESETS;
const photoInput = ref<HTMLInputElement | null>(null);
const profileMessage = ref(''); const profileError = ref(false);
const passwordMessage = ref(''); const passwordError = ref(false);
const photoMessage = ref(''); const photoError = ref(false);
watch(() => props.profile, value => {
  name.value = value.display_name || value.username;
  username.value = value.username;
}, { immediate: true });
watch(() => props.profile.avatar_path, value => { selectedPreset.value = avatarPresetFromPath(value); }, { immediate: true });
function clearPhoto() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null; photo.value = null;
  if (photoInput.value) photoInput.value.value = '';
}
function togglePicturePicker() {
  if (picturePickerOpen.value) {
    clearPhoto(); selectedPreset.value = avatarPresetFromPath(props.profile.avatar_path);
    photoMessage.value = ''; photoError.value = false; presetPickerOpen.value = false;
    picturePickerOpen.value = false;
  } else picturePickerOpen.value = true;
}
function openAlbum() {
  presetPickerOpen.value = false;
  photoInput.value?.click();
}
function choosePhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  photoMessage.value = ''; photoError.value = false; clearPhoto(); selectedPreset.value = null;
  try { validateAvatar(file); photo.value = file; previewUrl.value = URL.createObjectURL(file); }
  catch (error) { photoError.value = true; photoMessage.value = accountError(error, 'Could not select this picture.'); }
}
function choosePreset(preset: AvatarPresetId) {
  clearPhoto(); selectedPreset.value = preset; photoMessage.value = ''; photoError.value = false;
}
async function savePhoto() {
  if (busy.value || !photo.value) return;
  busy.value = 'avatar'; photoMessage.value = '';
  try {
    const updated = await uploadAvatar(props.profile, photo.value);
    emit('updated', updated); clearPhoto(); photoError.value = false; photoMessage.value = 'Profile picture saved.';
    presetPickerOpen.value = false; picturePickerOpen.value = false;
  } catch (error) { photoError.value = true; photoMessage.value = accountError(error, 'Could not save your profile picture.'); }
  finally { busy.value = ''; }
}
async function savePreset() {
  const preset = selectedPreset.value;
  if (busy.value || !preset || !presetNeedsSave.value) return;
  busy.value = 'preset'; photoMessage.value = '';
  try {
    emit('updated', await saveAvatarPreset(props.profile, preset));
    photoError.value = false; photoMessage.value = 'Avatar sticker saved.';
    presetPickerOpen.value = false; picturePickerOpen.value = false;
  } catch (error) { photoError.value = true; photoMessage.value = accountError(error, 'Could not save your avatar sticker.'); }
  finally { busy.value = ''; }
}
async function saveNames() {
  if (busy.value) return;
  busy.value = 'profile'; profileMessage.value = '';
  try {
    emit('updated', await savePersonalProfile(props.profile.id, name.value, username.value));
    profileError.value = false; profileMessage.value = 'Your profile has been updated.';
  } catch (error) { profileError.value = true; profileMessage.value = accountError(error, 'Could not save your profile.'); }
  finally { busy.value = ''; }
}
async function savePassword() {
  if (busy.value) return;
  busy.value = 'password'; passwordMessage.value = '';
  try {
    await changePassword(currentPassword.value, password.value, confirmation.value);
    currentPassword.value = ''; password.value = ''; confirmation.value = '';
    passwordError.value = false; passwordMessage.value = 'Your password has been updated.';
  } catch (error) { passwordError.value = true; passwordMessage.value = accountError(error, 'Could not change your password.'); }
  finally { busy.value = ''; }
}
onBeforeUnmount(() => { clearPhoto(); currentPassword.value = ''; password.value = ''; confirmation.value = ''; });
</script>
<style scoped>
.settings-layout { display: grid; max-width: 820px; gap: 14px; margin: 0 auto; }
.account-panel { padding: 20px; border-radius: 16px; }
.profile-card { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 28px 20px; text-align: center; }
.profile-identity { display: grid; justify-items: center; min-width: 0; gap: 4px; }
.profile-identity h2 { margin: 0; color: var(--app-heading); font-size: 22px; overflow-wrap: anywhere; }
.profile-identity p { margin: 0; }
.profile-username, .account-email { color: var(--app-muted); font-size: 13px; overflow-wrap: anywhere; }
.profile-provider { color: var(--app-accent); font-size: 12px; font-weight: 700; }
.picture-picker { display: grid; justify-items: center; gap: 14px; width: 100%; padding-top: 4px; }
.picture-source-options { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
.avatar-options { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
.avatar-choice { display: grid; justify-items: center; gap: 4px; min-width: 66px; padding: 6px; border: 1px solid transparent; border-radius: 12px; background: transparent; color: var(--app-muted); cursor: pointer; transition: background .15s, border-color .15s, transform .15s; }
.avatar-choice:hover { transform: translateY(-2px); }
.avatar-choice:focus-visible { outline: 2px solid var(--app-accent); outline-offset: 2px; }
.avatar-choice img { width: 48px; height: 48px; border-radius: 50%; }
.avatar-choice span { font-size: 11px; font-weight: 650; }
.avatar-choice-selected { border-color: var(--app-accent); background: var(--app-soft); color: var(--app-heading); }
.avatar-choice:disabled { cursor: wait; opacity: .65; }
.photo-hint { text-align: center; }
.photo-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
.profile-feedback { width: 100%; margin: 0; text-align: center; }
.preset-save-row { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px; width: 100%; padding-top: 14px; margin-top: 4px; border-top: 1px solid var(--app-border); }
.panel-heading { margin-bottom: 16px; }
.panel-heading h2, .appearance-setting h2 { color: var(--app-heading); font-size: 18px; font-weight: 750; margin: 0; }
.settings-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; align-items: start; }
.field { display: grid; min-width: 0; gap: 6px; color: var(--app-heading); font-size: 13px; font-weight: 700; }
.settings-hint { grid-column: 1 / -1; color: var(--app-muted); font-size: 12px; line-height: 1.5; margin: 0; }
.settings-form .feedback { grid-column: 1 / -1; margin: 0; }
.settings-form .ui-button { grid-column: 1 / -1; justify-self: start; }
.appearance-setting { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.appearance-setting .settings-hint { margin-top: 5px; }
.theme-control { display: flex; align-items: center; gap: 12px; }
.theme-label { color: var(--ion-text-color); font-size: 13px; font-weight: 650; }
.theme-switch { position: relative; flex-shrink: 0; width: 46px; height: 26px; padding: 0; border: 0; border-radius: 30px; background: var(--app-border); cursor: pointer; transition: background .15s; }
.theme-switch span { position: absolute; top: 3px; left: 3px; display: block; width: 20px; height: 20px; border-radius: 50%; background: white; box-shadow: 0 1px 3px #0003; transition: transform .15s; }
.theme-switch[aria-checked="true"] { background: var(--app-accent); }
.theme-switch[aria-checked="true"] span { transform: translateX(20px); }
.logout-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 4px; }
.logout-row p { margin: 0; color: var(--app-muted); font-size: 13px; }
.logout-button { color: var(--app-error-text); background: var(--app-error-bg); }
@media (max-width: 650px) {
  .profile-card { padding: 24px 16px; }
  .picture-source-options { flex-direction: column; width: min(100%, 260px); }
}
@media (max-width: 480px) {
  .account-panel { padding: 16px; }
  .settings-form { grid-template-columns: minmax(0, 1fr); }
  .appearance-setting { align-items: flex-start; }
  .theme-control { gap: 8px; }
}
</style>
