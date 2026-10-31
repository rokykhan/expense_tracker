import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, ChipRow } from '@/components/form';
import { MoneyText } from '@/components/money-text';
import { MonthSwitcher } from '@/components/month-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import type { CategoryRecord } from '@/features/categories/domain/types';
import { AmountBars, CategoryPie } from '@/features/reports/components/report-charts';
import { dailySeries, monthlySlices, withPercents } from '@/features/reports/domain/summary';
import type { TransactionRecord } from '@/features/transactions/domain/types';
import { monthTotals } from '@/features/transactions/domain/ledger';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/providers/settings-provider';
import { toBanglaDigits } from '@/utils/bangla-digits';
import { currentDhakaMonth } from '@/utils/date';

export function MonthlyReport({
  transactions,
  categories,
}: {
  transactions: TransactionRecord[];
  categories: CategoryRecord[];
}) {
  const theme = useTheme();
  const { banglaDigits } = useSettings();
  const [month, setMonth] = useState(() => currentDhakaMonth());
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const totals = monthTotals(transactions, month.year, month.month);
  const slices = withPercents(monthlySlices(transactions, month.year, month.month, kind));
  const days = dailySeries(transactions, month.year, month.month, kind);

  return (
    <>
      <MonthSwitcher year={month.year} month={month.month} onChange={setMonth} />
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.line}>
          <ThemedText>{copy.income}</ThemedText>
          <MoneyText paisa={totals.income} />
        </View>
        <View style={styles.line}>
          <ThemedText>{copy.expense}</ThemedText>
          <MoneyText paisa={-totals.expense} />
        </View>
      </ThemedView>
      <ChipRow>
        <Chip label={copy.expense} selected={kind === 'expense'} onPress={() => setKind('expense')} />
        <Chip label={copy.income} selected={kind === 'income'} onPress={() => setKind('income')} />
      </ChipRow>
      {slices.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          {kind === 'expense' ? copy.reportExpenseEmpty : copy.reportIncomeEmpty}
        </ThemedText>
      ) : (
        <>
          <CategoryPie
            slices={slices.map((slice) => ({
              value: slice.amount,
              color: categories.find((item) => item.id === slice.categoryId)?.color ?? theme.textSecondary,
            }))}
          />
          <AmountBars
            points={days.map((point) => ({
              value: point.amount,
              label: banglaDigits ? toBanglaDigits(String(point.key)) : String(point.key),
              color: theme.accent,
            }))}
          />
          {slices.map((slice) => {
            const category = categories.find((item) => item.id === slice.categoryId);
            const percentText = banglaDigits ? toBanglaDigits(String(slice.percent)) : String(slice.percent);
            return (
              <View key={slice.categoryId ?? 'none'} style={styles.share}>
                <View style={styles.line}>
                  <ThemedText>{category?.name ?? copy.unknown}</ThemedText>
                  <ThemedText type="small">{percentText}%</ThemedText>
                </View>
                <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${slice.percent}%`,
                        backgroundColor: category?.color ?? theme.accent,
                      },
                    ]}
                  />
                </View>
                <MoneyText
                  paisa={kind === 'expense' ? -slice.amount : slice.amount}
                  type="small"
                  themeColor="textSecondary"
                />
              </View>
            );
          })}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  share: {
    gap: Spacing.one,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});
