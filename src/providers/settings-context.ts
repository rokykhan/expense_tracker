import { createContext, useContext } from 'react';

import type { AppSettings } from '@/features/settings/data/settings';
import type { ThemeMode } from '@/features/settings/domain/appearance';

export type SettingsContextValue = AppSettings & {
  saveProfile: (profileName: string, currencySymbol: string) => Promise<void>;
  saveThemeMode: (mode: ThemeMode) => Promise<void>;
  saveAccent: (accent: string) => Promise<void>;
  saveHidePreview: (hidden: boolean) => Promise<void>;
  saveBiometrics: (enabled: boolean) => Promise<void>;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error('SettingsProvider is missing.');
  }
  return value;
}
