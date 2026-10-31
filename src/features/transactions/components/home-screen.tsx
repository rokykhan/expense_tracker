import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton, TextButton } from '@/components/form';
import { MoneyText } from '@/components/money-text';
import { MonthSwitcher } from '@/components/month-switcher';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { QuickEntryBar } from '@/features/quick-entry/components/quick-entry-bar';
import { listQuickEntries } from '@/features/quick-entry/data/quick-entries';
import type { QuickEntryRecord } from '@/features/quick-entry/domain/types';
import { UndoBanner } from '@/features/transactions/components/undo-banner';
import { TransactionRow } from '@/features/transactions/components/transaction-row';
import { useLedger } from '@/features/transactions/data/use-ledger';
import { monthTotals, recentTransactions, totalBalance, transactionsInMonth } from '@/features/transactions/domain/ledger';
import { useDbQuery } from '@/hooks/use-db-query';
import { useRefresh } from '@/providers/refresh-provider';
import { useSettings } from '@/providers/settings-provider';
import { currentDhakaMonth } from '@/utils/date';
import { openPath } from '@/utils/navigation';

const EMPTY_SHORTCUTS: QuickEntryRecord[] = [];

export function HomeScreen() {
  const ledger = useLedger();
  const shortcuts = useDbQuery(listQuickEntries, EMPTY_SHORTCUTS);
  const { processorError } = useRefresh();
  const { profileName } = useSettings();
  const [month, setMonth] = useState(() => currentDhakaMonth());

  if (ledger.loading) {
    return <EmptyScreen title={copy.appName} message={copy.loading} />;
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
  const recent = recentTransactions(transactionsInMonth(ledger.transactions, month.year, month.month), 8);

  return (
    <View style={styles.fill}>
      <Screen tabBar>
        {profileName ? <ThemedText type="smallBold">{profileName}</ThemedText> : null}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary">
            {copy.balance}
          </ThemedText>
          <MoneyText paisa={totalBalance(ledger.accounts, ledger.transactions)} type="subtitle" />
        </ThemedView>
        <MonthSwitcher year={month.year} month={month.month} onChange={setMonth} />
        <ThemedView type="backgroundElement" style={styles.card}>
          <SummaryLine label={copy.income} paisa={totals.income} />
          <SummaryLine label={copy.expense} paisa={-totals.expense} />
          <SummaryLine label={copy.savings} paisa={totals.savings} />
        </ThemedView>
        {processorError ? <FormMessage message={processorError} /> : null}
        <QuickEntryBar entries={shortcuts.data} error={shortcuts.error} onApplied={ledger.retry} />
        <View style={styles.heading}>
          <ThemedText type="smallBold">{copy.recent}</ThemedText>
          <TextButton label={copy.seeAll} onPress={() => openPath('/transactions')} />
        </View>
        {recent.length === 0 ? (
          <ThemedText themeColor="textSecondary">{copy.monthEmpty}</ThemedText>
        ) : (
          recent.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              accounts={ledger.accounts}
              categories={ledger.categories}
              onPress={() =>
                router.push({ pathname: '/transaction/[id]', params: { id: String(transaction.id) } })
              }
            />
          ))
        )}
        <PrimaryButton label={copy.newEntry} onPress={() => router.push({ pathname: '/transaction/new' })} />
      </Screen>
      <UndoBanner tabBar onRestored={ledger.retry} />
    </View>
  );
}

function SummaryLine({ label, paisa }: { label: string; paisa: number }) {
  return (
    <View style={styles.line}>
      <ThemedText>{label}</ThemedText>
      <MoneyText paisa={paisa} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
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
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
