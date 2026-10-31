import { BarChart, PieChart } from 'react-native-gifted-charts';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/providers/settings-provider';
import { toBanglaDigits } from '@/utils/bangla-digits';

type Slice = {
  value: number;
  color: string;
};

type BarPoint = {
  value: number;
  label: string;
  color: string;
};

export function CategoryPie({ slices }: { slices: Slice[] }) {
  const theme = useTheme();
  const data = slices.filter((slice) => slice.value > 0);
  if (data.length === 0) {
    return null;
  }

  return (
    <View style={styles.pie}>
      <PieChart
        data={data}
        donut
        radius={88}
        innerRadius={52}
        innerCircleColor={theme.background}
        focusOnPress={false}
        isAnimated={false}
      />
    </View>
  );
}

export function AmountBars({ points }: { points: BarPoint[] }) {
  const theme = useTheme();
  const { banglaDigits } = useSettings();
  const { width } = useWindowDimensions();
  const data = points.filter((point) => point.value > 0);
  if (data.length === 0) {
    return null;
  }

  const chartWidth = Math.max(160, Math.min(width, MaxContentWidth) - Spacing.three * 2 - 48);
  const barWidth = data.length > 16 ? 10 : 18;
  const spacing = 10;
  const labelStyle = {
    color: theme.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 11,
  };

  return (
    <View style={styles.bars}>
      <BarChart
        data={data.map((point) => ({
          value: point.value,
          label: point.label,
          frontColor: point.color,
        }))}
        width={chartWidth}
        barWidth={barWidth}
        spacing={spacing}
        disableScroll={data.length * (barWidth + spacing) <= chartWidth}
        noOfSections={4}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        yAxisLabelWidth={44}
        isAnimated={false}
        yAxisTextStyle={labelStyle}
        xAxisLabelTextStyle={labelStyle}
        formatYLabel={(label) => {
          const paisa = Number(label);
          if (!Number.isFinite(paisa)) {
            return '';
          }
          const taka = String(Math.trunc(paisa / 100));
          return banglaDigits ? toBanglaDigits(taka) : taka;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pie: {
    alignItems: 'center',
  },
  bars: {
    overflow: 'hidden',
  },
});
