import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { toBanglaDigits } from '@/utils/bangla-digits';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'] as const;

export function PinPad({
  title,
  message,
  disabled,
  onSubmit,
}: {
  title: string;
  message: string | null;
  disabled: boolean;
  onSubmit: (pin: string) => void;
}) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const labelColor = scheme === 'dark' ? '#10202B' : '#FFFFFF';
  const [digits, setDigits] = useState('');

  function press(key: string) {
    if (disabled) {
      return;
    }
    if (key === 'delete') {
      setDigits((current) => current.slice(0, -1));
      return;
    }
    setDigits((current) => (current.length >= 6 ? current : `${current}${key}`));
  }

  return (
    <ThemedView style={styles.pad}>
      <ThemedText type="subtitle" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText type="title" style={styles.dots}>
        {digits.length === 0 ? ' ' : '●'.repeat(digits.length)}
      </ThemedText>
      {message ? <ThemedText style={styles.center}>{message}</ThemedText> : null}
      <View style={styles.keys}>
        {KEYS.map((key) =>
          key === '' ? (
            <View key="spacer" style={styles.key} />
          ) : (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === 'delete' ? copy.lockDelete : toBanglaDigits(key)}
              disabled={disabled}
              onPress={() => press(key)}
              style={[styles.key, { backgroundColor: theme.backgroundElement, opacity: disabled ? 0.4 : 1 }]}>
              <ThemedText type="subtitle">{key === 'delete' ? copy.lockDelete : toBanglaDigits(key)}</ThemedText>
            </Pressable>
          ),
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || digits.length < 4}
        onPress={() => onSubmit(digits)}
        style={[styles.unlock, { backgroundColor: theme.accent, opacity: disabled || digits.length < 4 ? 0.4 : 1 }]}>
        <ThemedText type="smallBold" style={{ color: labelColor }}>
          {copy.unlock}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pad: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  center: {
    textAlign: 'center',
  },
  dots: {
    textAlign: 'center',
    letterSpacing: 6,
  },
  keys: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  key: {
    width: 88,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlock: {
    alignSelf: 'center',
    borderRadius: 14,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
