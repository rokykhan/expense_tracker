import { Pressable, StyleSheet, View } from 'react-native';

import { Chip, ChipRow, FieldLabel } from '@/components/form';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { COLOR_CHOICES, ICON_CHOICES } from '@/constants/pickers';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const theme = useTheme();
  const colors = COLOR_CHOICES.includes(value as (typeof COLOR_CHOICES)[number])
    ? COLOR_CHOICES
    : [value, ...COLOR_CHOICES];

  return (
    <View style={styles.block}>
      <FieldLabel label={copy.color} />
      <View style={styles.colors}>
        {colors.map((color) => {
          const selected = color === value;
          return (
            <Pressable
              key={color}
              accessibilityRole="button"
              accessibilityLabel={color}
              accessibilityState={{ selected }}
              onPress={() => onChange(color)}
              style={[
                styles.swatchWrap,
                { borderColor: selected ? theme.accent : 'transparent' },
              ]}>
              <ThemedView style={[styles.swatch, { backgroundColor: color }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const choices = ICON_CHOICES.some((icon) => icon.name === value)
    ? ICON_CHOICES
    : [{ name: value, label: value }, ...ICON_CHOICES];

  return (
    <View style={styles.block}>
      <FieldLabel label={copy.icon} />
      <ChipRow>
        {choices.map((icon) => (
          <Chip
            key={icon.name}
            label={icon.label}
            selected={icon.name === value}
            onPress={() => onChange(icon.name)}
          />
        ))}
      </ChipRow>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.two,
  },
  colors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  swatchWrap: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 2,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
