/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useContext } from 'react';

import { Colors, type ThemeColor } from '@/constants/theme';
import { accentFor } from '@/features/settings/domain/appearance';
import { DEFAULT_ACCENT } from '@/db/seed';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SettingsContext } from '@/providers/settings-context';

export function useTheme(): { [K in ThemeColor]: string } {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  const settings = useContext(SettingsContext);

  return {
    ...Colors[theme],
    accent: accentFor(theme, settings?.accent ?? DEFAULT_ACCENT),
  };
}
