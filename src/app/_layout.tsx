import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { EmptyScreen } from '@/components/empty-screen';
import { copy } from '@/constants/copy';
import { Colors, FontFamily } from '@/constants/theme';
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
          <Stack
            screenOptions={{
              headerTitleStyle: { fontFamily: FontFamily.medium },
              headerTintColor: colorScheme === 'dark' ? Colors.dark.accent : Colors.light.accent,
              headerStyle: {
                backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
              },
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
              },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </DatabaseProvider>
      )}
    </ThemeProvider>
  );
}
