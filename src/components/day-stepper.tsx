import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { useSettings } from '@/providers/settings-provider';
import { dhakaDateToIso, formatDateDhaka, shiftDay, todayDhakaDayKey } from '@/utils/date';

type DayStepperProps = {
  label: string;
  value: string | null;
  onChange: (next: string | null) => void;
  optional?: boolean;
};

export function DayStepper({ label, value, onChange, optional = false }: DayStepperProps) {
  const { banglaDigits } = useSettings();
  const current = value ?? todayDhakaDayKey();
  const [year, month, day] = current.split('-').map(Number);
  const shown = value
    ? formatDateDhaka(dhakaDateToIso(year, month, day), banglaDigits)
    : copy.all;

  return (
    <View style={styles.wrap}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.previousDay}
          onPress={() => onChange(shiftDay(current, -1))}
          style={styles.side}>
          <ThemedText type="small">{copy.previousDay}</ThemedText>
        </Pressable>
        <ThemedText type="smallBold" style={styles.label}>
          {shown}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.nextDay}
          onPress={() => onChange(shiftDay(current, 1))}
          style={styles.side}>
          <ThemedText type="small">{copy.nextDay}</ThemedText>
        </Pressable>
      </View>
      {optional && value ? (
        <Pressable accessibilityRole="button" onPress={() => onChange(null)}>
          <ThemedText type="small" themeColor="textSecondary">
            {copy.clear}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  side: {
    paddingVertical: Spacing.two,
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
});
