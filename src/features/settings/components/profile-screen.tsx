import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormMessage, PrimaryButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { ACCENT_PRESETS, type ThemeMode } from '@/features/settings/domain/appearance';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/providers/settings-provider';
import { openPath } from '@/utils/navigation';

const THEMES: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: copy.themeLight },
  { mode: 'dark', label: copy.themeDark },
  { mode: 'system', label: copy.themeSystem },
];

export function ProfileScreen() {
  const settings = useSettings();
  const theme = useTheme();
  const scheme = useColorScheme();
  const [name, setName] = useState(settings.profileName);
  const [symbol, setSymbol] = useState(settings.currencySymbol);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await settings.saveProfile(name, symbol);
      setMessage(null);
      setSaving(false);
    } catch {
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  async function chooseTheme(mode: ThemeMode) {
    try {
      await settings.saveThemeMode(mode);
      setMessage(null);
    } catch {
      setMessage(copy.dbError);
    }
  }

  async function chooseAccent(accent: string) {
    try {
      await settings.saveAccent(accent);
      setMessage(null);
    } catch {
      setMessage(copy.dbError);
    }
  }

  return (
    <Screen>
      <TextField label={copy.name} value={name} onChangeText={setName} />
      <TextField label={copy.currency} value={symbol} onChangeText={setSymbol} />
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
      <ThemedText type="smallBold">{copy.theme}</ThemedText>
      <View style={styles.row}>
        {THEMES.map((item) => (
          <Pressable
            key={item.mode}
            accessibilityRole="button"
            accessibilityState={{ selected: settings.themeMode === item.mode }}
            onPress={() => void chooseTheme(item.mode)}
            style={[
              styles.choice,
              {
                backgroundColor: settings.themeMode === item.mode ? theme.backgroundSelected : theme.backgroundElement,
                borderColor: settings.themeMode === item.mode ? theme.accent : 'transparent',
              },
            ]}>
            <ThemedText type="small">{item.label}</ThemedText>
          </Pressable>
        ))}
      </View>
      <ThemedText type="smallBold">{copy.accent}</ThemedText>
      <View style={styles.swatches}>
        {ACCENT_PRESETS.map((preset) => (
          <Pressable
            key={preset.light}
            accessibilityRole="button"
            accessibilityLabel={preset.light}
            accessibilityState={{ selected: settings.accent === preset.light }}
            onPress={() => void chooseAccent(preset.light)}
            style={[
              styles.swatch,
              {
                backgroundColor: scheme === 'dark' ? preset.dark : preset.light,
                borderColor: settings.accent === preset.light ? theme.text : 'transparent',
              },
            ]}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: settings.hidePreview }}
        onPress={() => void settings.saveHidePreview(!settings.hidePreview).catch(() => setMessage(copy.dbError))}>
        <ThemedView
          type="backgroundElement"
          style={[styles.link, settings.hidePreview ? { borderColor: theme.accent } : null]}>
          <ThemedText>{copy.hidePreview}</ThemedText>
        </ThemedView>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => openPath('/settings/lock')}>
        <ThemedView type="backgroundElement" style={styles.link}>
          <ThemedText>{copy.appLock}</ThemedText>
        </ThemedView>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  choice: {
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
  },
  link: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
});

