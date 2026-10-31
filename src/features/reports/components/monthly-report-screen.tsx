import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { Chip, ChipRow, FormMessage, PrimaryButton } from '@/components/form';
import { MoneyText } from '@/components/money-text';
import { MonthSwitcher } from '@/components/month-switcher';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { useLedger } from '@/features/transactions/data/use-ledger';
import { categoryBreakdown, monthTotals } from '@/features/transactions/domain/ledger';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/providers/settings-provider';
import { toBanglaDigits } from '@/utils/bangla-digits';
import { currentDhakaMonth } from '@/utils/date';

export function MonthlyReportScreen() {
  const ledger = useLedger();
  const theme = useTheme();
  const { banglaDigits } = useSettings();
  const [month, setMonth] = useState(() => currentDhakaMonth());
  const [kind, setKind] = useState<'expense' | 'income'>('expense');

  if (ledger.loading) {
    return <EmptyScreen title={copy.tabs.reports} message={copy.loading} />;
  }

  if (ledger.error) {
    return (
      <Screen tabBar>
        <FormMessage message={ledger.error} />
        <PrimaryButton label={copy.retry} onPress={ledger.retry} />
      </Screen>
    );
  }

  const totals = monthTotals(ledger.transactions, month.year, month.month);
  const shares = categoryBreakdown(ledger.transactions, month.year, month.month, kind);

  return (
    <Screen tabBar>
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
      {shares.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          {kind === 'expense' ? copy.reportExpenseEmpty : copy.reportIncomeEmpty}
        </ThemedText>
      ) : (
        shares.map((share) => {
          const category = ledger.categories.find((item) => item.id === share.categoryId);
          const percentText = banglaDigits ? toBanglaDigits(String(share.percent)) : String(share.percent);
          return (
            <View key={share.categoryId} style={styles.share}>
              <View style={styles.line}>
                <ThemedText>{category?.name ?? copy.unknown}</ThemedText>
                <ThemedText type="small">
                  {percentText}%
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${share.percent}%`,
                      backgroundColor: category?.color ?? theme.accent,
                    },
                  ]}
                />
              </View>
              <MoneyText paisa={kind === 'expense' ? -share.amount : share.amount} type="small" themeColor="textSecondary" />
            </View>
          );
        })
      )}
    </Screen>
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
