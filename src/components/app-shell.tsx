import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { Appearance } from 'react-native';

import { FontFamily } from '@/constants/theme';
import { LockGate } from '@/features/lock/components/lock-gate';
import { PreviewGuard } from '@/features/lock/components/preview-guard';
import { WidgetRunner } from '@/features/widget/components/widget-runner';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/providers/settings-context';

export function AppShell() {
  const scheme = useColorScheme();
  const theme = useTheme();
  const { themeMode } = useSettings();

  useEffect(() => {
    if (typeof Appearance.setColorScheme !== 'function') {
      return;
    }
    Appearance.setColorScheme(themeMode === 'system' ? 'unspecified' : themeMode);
  }, [themeMode]);

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PreviewGuard />
      <WidgetRunner />
      <LockGate>
        <Stack
          screenOptions={{
            headerTitleStyle: { fontFamily: FontFamily.medium },
            headerTintColor: theme.accent,
            headerStyle: { backgroundColor: theme.background },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </LockGate>
    </ThemeProvider>
  );
}
