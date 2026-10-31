import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { useSettings } from '@/providers/settings-provider';
import { formatMonthDhaka, shiftMonth } from '@/utils/date';

type MonthSwitcherProps = {
  year: number;
  month: number;
  onChange: (next: { year: number; month: number }) => void;
};

export function MonthSwitcher({ year, month, onChange }: MonthSwitcherProps) {
  const { banglaDigits } = useSettings();

  return (
    <ThemedView type="backgroundElement" style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.previousMonth}
        onPress={() => onChange(shiftMonth(year, month, -1))}
        style={styles.side}>
        <ThemedText type="smallBold">{copy.previousMonth}</ThemedText>
      </Pressable>
      <View style={styles.label}>
        <ThemedText type="smallBold">{formatMonthDhaka(year, month, banglaDigits)}</ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.nextMonth}
        onPress={() => onChange(shiftMonth(year, month, 1))}
        style={styles.side}>
        <ThemedText type="smallBold">{copy.nextMonth}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: 14,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  side: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  label: {
    flex: 1,
    alignItems: 'center',
  },
});
