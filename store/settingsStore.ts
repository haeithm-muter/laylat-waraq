import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardColorThemeId, defaultCardColorTheme } from '@/theme/colors';

export type AppLanguage = 'ar' | 'en';

interface SettingsState {
  soundEnabled: boolean;
  language: AppLanguage;
  cardColorTheme: CardColorThemeId;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  setLanguage: (language: AppLanguage) => void;
  setCardColorTheme: (theme: CardColorThemeId) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      // English is on the roadmap (PRD §4.2) but not yet implemented — the
      // Settings panel exposes it as a disabled "قريباً" option for now.
      language: 'ar',
      cardColorTheme: defaultCardColorTheme,

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
      setLanguage: (language) => set({ language }),
      setCardColorTheme: (cardColorTheme) => set({ cardColorTheme }),
    }),
    {
      name: 'laylat-waraq/settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
