import { create } from 'zustand';

const STORAGE_KEY = 'aba-theme';

function loadTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  } catch {
    return 'dark';
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

// Apply on load
applyTheme(loadTheme());

export const useThemeStore = create((set) => ({
  theme: loadTheme(),
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    return { theme: next };
  }),
}));
