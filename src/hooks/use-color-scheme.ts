import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { resolveScheme } from '@/features/settings/domain/appearance';
import { SettingsContext } from '@/providers/settings-context';

export function useColorScheme() {
  const settings = useContext(SettingsContext);
  const system = useRNColorScheme();
  return resolveScheme(settings?.themeMode ?? 'system', system);
}
