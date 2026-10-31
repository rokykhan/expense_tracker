import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MoneyText } from '@/components/money-text';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { AmountBars } from '@/features/reports/components/report-charts';
import { yearMonths } from '@/features/reports/domain/summary';
import type { TransactionRecord } from '@/features/transactions/domain/types';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/providers/settings-provider';
import { toBanglaDigits } from '@/utils/bangla-digits';
import { currentDhakaMonth, dhakaDateToIso } from '@/utils/date';

function monthName(year: number, month: number, banglaDigits: boolean): string {
  return new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    month: 'long',
    numberingSystem: banglaDigits ? 'beng' : 'latn',
  }).format(new Date(dhakaDateToIso(year, month, 15)));
}

export function YearlyReport({ transactions }: { transactions: TransactionRecord[] }) {
  const theme = useTheme();
  const { banglaDigits } = useSettings();
  const [year, setYear] = useState(() => currentDhakaMonth().year);
  const months = yearMonths(transactions, year);
  const yearLabel = banglaDigits ? toBanglaDigits(String(year)) : String(year);

  return (
    <>
      <ThemedView type="backgroundElement" style={styles.switcher}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.previousYear}
          onPress={() => setYear((current) => current - 1)}
          style={styles.side}>
          <ThemedText type="smallBold">{copy.previousYear}</ThemedText>
        </Pressable>
        <ThemedText type="smallBold" style={styles.year}>
          {yearLabel}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.nextYear}
          onPress={() => setYear((current) => current + 1)}
          style={styles.side}>
          <ThemedText type="smallBold">{copy.nextYear}</ThemedText>
        </Pressable>
      </ThemedView>
      <AmountBars
        points={months.map((month) => ({
          value: month.expense,
          label: banglaDigits ? toBanglaDigits(String(month.month)) : String(month.month),
          color: theme.accent,
        }))}
      />
      <View style={styles.table}>
        <View style={styles.row}>
          <ThemedText type="smallBold" style={styles.month}>
            {copy.frequency.monthly}
          </ThemedText>
          <ThemedText type="smallBold" style={styles.amount}>
            {copy.income}
          </ThemedText>
          <ThemedText type="smallBold" style={styles.amount}>
            {copy.expense}
          </ThemedText>
          <ThemedText type="smallBold" style={styles.amount}>
            {copy.savings}
          </ThemedText>
        </View>
        {months.map((month) => (
          <View key={month.month} style={styles.row}>
            <ThemedText type="small" style={styles.month}>
              {monthName(month.year, month.month, banglaDigits)}
            </ThemedText>
            <MoneyText paisa={month.income} type="small" style={styles.amount} />
            <MoneyText paisa={-month.expense} type="small" style={styles.amount} />
            <MoneyText paisa={month.net} type="small" style={styles.amount} />
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  switcher: {
    borderRadius: 14,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  year: {
    flex: 1,
    textAlign: 'center',
  },
  table: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  month: {
    flex: 1.4,
  },
  amount: {
    flex: 1,
    textAlign: 'right',
  },
});
