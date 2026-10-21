import { ref } from 'vue';

const KEY = 'lakbaynaujan-theme';
export const darkMode = ref(false);

function applyTheme(enabled: boolean) {
  darkMode.value = enabled;
  document.documentElement.classList.toggle('ion-palette-dark', enabled);
  document.documentElement.style.colorScheme = enabled ? 'dark' : 'light';
}

export function initializeTheme() {
  let preference: string | null = null;
  try { preference = localStorage.getItem(KEY); } catch { /* Storage may be disabled. */ }
  applyTheme(preference === 'dark' || (preference !== 'light' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true));
}

export function setDarkMode(enabled: boolean) {
  applyTheme(enabled);
  try { localStorage.setItem(KEY, enabled ? 'dark' : 'light'); } catch { /* The toggle still works for this visit. */ }
}
