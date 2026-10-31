import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export const MeterTone = {
  warning: '#A6843D',
  over: '#8E3B3B',
} as const;

export function Meter({ ratio, tone }: { ratio: number; tone: 'ok' | 'warning' | 'over' }) {
  const theme = useTheme();
  const width = `${Math.max(0, Math.min(ratio, 1)) * 100}%` as `${number}%`;

  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <View
        style={[
          styles.bar,
          { width, backgroundColor: tone === 'ok' ? theme.accent : MeterTone[tone] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
});
