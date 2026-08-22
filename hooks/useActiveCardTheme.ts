import { useSettingsStore } from '@/store/settingsStore';
import { cardColorThemes, CardColorTheme } from '@/theme/colors';

/** Returns the currently-selected card color theme object (Settings → ألوان الورق). */
export function useActiveCardTheme(): CardColorTheme {
  const themeId = useSettingsStore((s) => s.cardColorTheme);
  return cardColorThemes[themeId];
}
