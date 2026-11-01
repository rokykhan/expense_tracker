import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AppShell } from '@/components/app-shell';
import { EmptyScreen } from '@/components/empty-screen';
import { copy } from '@/constants/copy';
import { FontFamily } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DatabaseProvider } from '@/providers/database-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    [FontFamily.regular]: require('@/assets/fonts/NotoSansBengali-Regular.ttf'),
    [FontFamily.medium]: require('@/assets/fonts/NotoSansBengali-Medium.ttf'),
    [FontFamily.semibold]: require('@/assets/fonts/NotoSansBengali-SemiBold.ttf'),
    [FontFamily.bold]: require('@/assets/fonts/NotoSansBengali-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {fontError ? (
        <EmptyScreen title={copy.appName} message={copy.fontError} />
      ) : (
        <DatabaseProvider>
          <AppShell />
        </DatabaseProvider>
      )}
    </ThemeProvider>
  );
}
