import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import {
  DEFAULT_CURRENCY_SYMBOL,
  SETTING_CURRENCY_SYMBOL,
  SETTING_PROFILE_NAME,
  readSettings,
  writeSetting,
  type AppSettings,
} from '@/features/settings/data/settings';

const DEFAULT_SETTINGS: AppSettings = {
  banglaDigits: true,
  profileName: '',
  currencySymbol: DEFAULT_CURRENCY_SYMBOL,
};

type SettingsContextValue = AppSettings & {
  saveProfile: (profileName: string, currencySymbol: string) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

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

  const value = useMemo(
    () => ({
      ...settings,
      saveProfile,
    }),
    [settings, saveProfile],
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

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error('SettingsProvider is missing.');
  }
  return value;
}

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
