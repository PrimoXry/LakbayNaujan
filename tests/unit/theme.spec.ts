import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { darkMode, initializeTheme, setDarkMode } from '@/lib/theme';

beforeEach(() => { localStorage.clear(); vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true }))); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.documentElement.classList.remove('ion-palette-dark'); });
describe('appearance preference', () => {
  it('uses the system preference until the user chooses a theme', () => {
    initializeTheme();
    expect(darkMode.value).toBe(true);
    setDarkMode(false);
    initializeTheme();
    expect(darkMode.value).toBe(false);
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
  it('keeps a selected dark theme after initialization', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    setDarkMode(true);
    initializeTheme();
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
    expect(localStorage.getItem('lakbaynaujan-theme')).toBe('dark');
  });
  it('still switches themes when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
    expect(() => { initializeTheme(); setDarkMode(false); }).not.toThrow();
    expect(darkMode.value).toBe(false);
  });
});
