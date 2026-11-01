import { useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { resolveScheme } from '@/features/settings/domain/appearance';
import { SettingsContext } from '@/providers/settings-context';

/**
 * To support static rendering, the system theme is re-calculated on the client.
 * An explicit light or dark choice applies as soon as settings have loaded.
 */
export function useColorScheme() {
  const settings = useContext(SettingsContext);
  const system = useRNColorScheme();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // The first client render must stay "light" so it matches the server HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, []);

  const mode = settings?.themeMode ?? 'system';
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }
  if (!hasHydrated) {
    return 'light';
  }
  return resolveScheme('system', system);
}
