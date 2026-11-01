import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { DEFAULT_ACCENT } from '@/db/seed';
import {
  DEFAULT_CURRENCY_SYMBOL,
  SETTING_ACCENT,
  SETTING_BIOMETRICS,
  SETTING_CURRENCY_SYMBOL,
  SETTING_HIDE_PREVIEW,
  SETTING_PROFILE_NAME,
  SETTING_THEME_MODE,
  readSettings,
  writeSetting,
  type AppSettings,
} from '@/features/settings/data/settings';
import { knownAccent, type ThemeMode } from '@/features/settings/domain/appearance';
import { SettingsContext, type SettingsContextValue } from '@/providers/settings-context';

const DEFAULT_SETTINGS: AppSettings = {
  banglaDigits: true,
  profileName: '',
  currencySymbol: DEFAULT_CURRENCY_SYMBOL,
  themeMode: 'system',
  accent: DEFAULT_ACCENT,
  hidePreview: false,
  biometrics: false,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    readSettings(db)
      .then((next) => {
        if (!cancelled) {
          setSettings(next);
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);
        if (!cancelled) {
          setError(copy.dbError);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const saveProfile = useCallback(
    async (profileName: string, currencySymbol: string) => {
      const symbol = currencySymbol.trim().slice(0, 4) || DEFAULT_CURRENCY_SYMBOL;
      const name = profileName.trim().slice(0, 40);
      await writeSetting(db, SETTING_PROFILE_NAME, name);
      await writeSetting(db, SETTING_CURRENCY_SYMBOL, symbol);
      setSettings((current) => ({ ...current, profileName: name, currencySymbol: symbol }));
    },
    [db],
  );

  const saveThemeMode = useCallback(
    async (mode: ThemeMode) => {
      await writeSetting(db, SETTING_THEME_MODE, mode);
      setSettings((current) => ({ ...current, themeMode: mode }));
    },
    [db],
  );

  const saveAccent = useCallback(
    async (accent: string) => {
      const next = knownAccent(accent);
      await writeSetting(db, SETTING_ACCENT, next);
      setSettings((current) => ({ ...current, accent: next }));
    },
    [db],
  );

  const saveHidePreview = useCallback(
    async (hidden: boolean) => {
      await writeSetting(db, SETTING_HIDE_PREVIEW, hidden ? '1' : '0');
      setSettings((current) => ({ ...current, hidePreview: hidden }));
    },
    [db],
  );

  const saveBiometrics = useCallback(
    async (enabled: boolean) => {
      await writeSetting(db, SETTING_BIOMETRICS, enabled ? '1' : '0');
      setSettings((current) => ({ ...current, biometrics: enabled }));
    },
    [db],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      saveProfile,
      saveThemeMode,
      saveAccent,
      saveHidePreview,
      saveBiometrics,
    }),
    [settings, saveProfile, saveThemeMode, saveAccent, saveHidePreview, saveBiometrics],
  );

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.message}>{error}</ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
          style={styles.retry}>
          <ThemedText type="smallBold">{copy.retry}</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export { useSettings } from '@/providers/settings-context';

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  message: {
    textAlign: 'center',
  },
  retry: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
