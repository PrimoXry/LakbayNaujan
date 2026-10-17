<template>
  <div class="settings-layout">
    <section class="account-panel profile-summary">
      <ProfileAvatar :name="profile.display_name || profile.username" :src="previewUrl || avatar" large />
      <h2>{{ profile.display_name || profile.username }}</h2>
      <p class="muted">@{{ profile.username }}</p>
      <p class="account-email">{{ email }}</p>
      <button type="button" class="ui-button ui-button-secondary photo-label" :disabled="!!busy" @click="photoInput?.click()">Choose profile picture</button>
      <input id="profile-photo" ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden :disabled="!!busy" @change="choosePhoto" />
      <p class="settings-hint">JPEG, PNG or WebP · up to 2 MB</p>
      <div v-if="photo" class="row-actions">
        <button type="button" class="ui-button" :disabled="!!busy" @click="savePhoto">{{ busy === 'avatar' ? 'Uploading…' : 'Save picture' }}</button>
        <button type="button" class="ui-button ui-button-secondary" :disabled="!!busy" @click="clearPhoto">Cancel</button>
      </div>
      <p v-if="photoMessage" class="feedback" :class="{ error: photoError }" role="status">{{ photoMessage }}</p>
    </section>
    <div class="settings-sections">
      <section class="account-panel">
        <div class="panel-heading"><h2>Edit profile</h2><p class="muted">Make this space your own.</p></div>
        <form class="stack" @submit.prevent="saveNames">
          <label for="profile-name">Name</label>
          <input id="profile-name" v-model="name" class="account-input" autocomplete="name" required maxlength="80" :disabled="!!busy" />
          <label for="profile-username">Username</label>
          <input id="profile-username" v-model="username" class="account-input" autocomplete="username" required minlength="3" maxlength="30" pattern="[A-Za-z0-9_]{3,30}" :disabled="!!busy" />
          <p class="settings-hint">3–30 letters, numbers or underscores. Your email stays the same.</p>
          <p v-if="profileMessage" class="feedback" :class="{ error: profileError }" role="status">{{ profileMessage }}</p>
          <button type="submit" class="ui-button" :disabled="!!busy">{{ busy === 'profile' ? 'Saving…' : 'Save profile' }}</button>
        </form>
      </section>
      <section class="account-panel">
        <div class="panel-heading"><h2>Change password</h2><p class="muted">Keep your account secure.</p></div>
        <form v-if="passwordLogin" class="stack" @submit.prevent="savePassword">
          <label for="current-password">Current password</label>
          <input id="current-password" v-model="currentPassword" class="account-input" type="password" autocomplete="current-password" required :disabled="!!busy" />
          <label for="new-password">New password</label>
          <input id="new-password" v-model="password" class="account-input" type="password" autocomplete="new-password" minlength="8" required :disabled="!!busy" />
          <label for="confirm-password">Confirm new password</label>
          <input id="confirm-password" v-model="confirmation" class="account-input" type="password" autocomplete="new-password" minlength="8" required :disabled="!!busy" />
          <p class="settings-hint">Use at least 8 characters.</p>
          <p v-if="passwordMessage" class="feedback" :class="{ error: passwordError }" role="status">{{ passwordMessage }}</p>
          <button type="submit" class="ui-button" :disabled="!!busy">{{ busy === 'password' ? 'Updating…' : 'Update password' }}</button>
        </form>
        <p v-else class="muted">You sign in with Google. Manage your password in your Google Account.</p>
      </section>
      <section class="account-panel appearance-setting">
        <div><h2>Dark mode</h2><p class="muted">A softer view for evening exploring.</p></div>
        <button type="button" class="theme-switch" role="switch" :aria-checked="darkMode" aria-label="Dark mode" @click="setDarkMode(!darkMode)"><span /></button>
      </section>
      <button type="button" class="ui-button logout-button" :disabled="!!busy || loggingOut" @click="$emit('logout')">{{ loggingOut ? 'Logging out…' : 'Log out' }}</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import ProfileAvatar from './ProfileAvatar.vue';
import { accountError, changePassword, savePersonalProfile, uploadAvatar, validateAvatar, type UserProfile } from '../lib/userAccount';
import { darkMode, setDarkMode } from '../lib/theme';
const props = defineProps<{ profile: UserProfile; email: string; avatar: string | null; loggingOut: boolean; passwordLogin: boolean }>();
const emit = defineEmits<{ updated: [profile: UserProfile]; logout: [] }>();
const name = ref(''); const username = ref('');
const currentPassword = ref(''); const password = ref(''); const confirmation = ref('');
const busy = ref(''); const photo = ref<File | null>(null); const previewUrl = ref<string | null>(null);
const photoInput = ref<HTMLInputElement | null>(null);
const profileMessage = ref(''); const profileError = ref(false);
const passwordMessage = ref(''); const passwordError = ref(false);
const photoMessage = ref(''); const photoError = ref(false);
watch(() => props.profile, value => { name.value = value.display_name || value.username; username.value = value.username; }, { immediate: true });
function clearPhoto() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null; photo.value = null;
  if (photoInput.value) photoInput.value.value = '';
}
function choosePhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  photoMessage.value = ''; clearPhoto();
  try { validateAvatar(file); photo.value = file; previewUrl.value = URL.createObjectURL(file); }
  catch (error) { photoError.value = true; photoMessage.value = accountError(error, 'Could not select this picture.'); }
}
async function savePhoto() {
  if (busy.value || !photo.value) return;
  busy.value = 'avatar'; photoMessage.value = '';
  try {
    const updated = await uploadAvatar(props.profile, photo.value);
    emit('updated', updated); clearPhoto(); photoError.value = false; photoMessage.value = 'Profile picture saved.';
  } catch (error) { photoError.value = true; photoMessage.value = accountError(error, 'Could not save your profile picture.'); }
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
.settings-layout { display: grid; grid-template-columns: minmax(0, 280px) minmax(0, 1fr); gap: 24px; align-items: start; }
.profile-summary { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.profile-summary h2 { margin: 6px 0 0; overflow-wrap: anywhere; }
.profile-summary p { margin: 0; }
.account-email { font-size: 13px; color: var(--app-muted); overflow-wrap: anywhere; max-width: 100%; }
.photo-label { margin-top: 12px; text-align: center; }
.settings-sections { display: flex; flex-direction: column; gap: 20px; }
.panel-heading h2, .appearance-setting h2 { font-size: 19px; margin: 0 0 6px; color: var(--app-heading); }
.panel-heading p { margin: 0 0 20px; font-size: 14px; }
.settings-hint { font-size: 12px; line-height: 1.5; color: var(--app-muted); margin: 0; }
form label { font-size: 13px; font-weight: 700; margin-top: 6px; }
form .ui-button { align-self: flex-start; margin-top: 10px; }
.appearance-setting { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.appearance-setting p { margin: 0; font-size: 13px; }
.theme-switch { padding: 4px; width: 50px; height: 30px; border-radius: 30px; flex-shrink: 0; border: 1px solid var(--app-border); background: var(--app-muted); cursor: pointer; }
.theme-switch span { display: block; width: 20px; height: 20px; border-radius: 50%; background: white; transition: transform .15s; }
.theme-switch[aria-checked="true"] { background: var(--app-accent); }
.theme-switch[aria-checked="true"] span { transform: translateX(20px); }
.logout-button { color: var(--app-error-text); background: var(--app-error-bg); align-self: flex-start; }
@media (max-width: 700px) { .settings-layout { grid-template-columns: minmax(0, 1fr); } }
</style>
