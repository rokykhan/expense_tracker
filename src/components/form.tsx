import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export function FieldLabel({ label }: { label: string }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary">
      {label}
    </ThemedText>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboard = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboard?: 'default' | 'decimal-pad';
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <FieldLabel label={label} />
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboard}
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
    </View>
  );
}

export function NoteField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <FieldLabel label={label} />
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[styles.input, styles.note, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
    </View>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {children}
    </ScrollView>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: selected ? theme.accent : 'transparent',
        },
      ]}>
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const labelColor = scheme === 'dark' ? '#10202B' : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.primary, { backgroundColor: theme.accent, opacity: disabled ? 0.5 : 1 }]}>
      <ThemedText type="smallBold" style={{ color: labelColor }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.textButton}>
      <ThemedText type="smallBold" style={{ color: theme.accent }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function FormMessage({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return <ThemedText themeColor="textSecondary">{message}</ThemedText>;
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  input: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  note: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chips: {
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  primary: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: Spacing.three,
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
