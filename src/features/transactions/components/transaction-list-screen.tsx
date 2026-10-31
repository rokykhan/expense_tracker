import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { DayStepper } from '@/components/day-stepper';
import { Chip, ChipRow, FieldLabel, FormMessage, PrimaryButton, TextButton, TextField } from '@/components/form';
import { MoneyText } from '@/components/money-text';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { UndoBanner } from '@/features/transactions/components/undo-banner';
import { TransactionRow } from '@/features/transactions/components/transaction-row';
import { useLedger } from '@/features/transactions/data/use-ledger';
import { filterTransactions, groupTransactionsByDay } from '@/features/transactions/domain/ledger';
import type { TransactionKind } from '@/features/transactions/domain/types';
import { useSettings } from '@/providers/settings-provider';
import { dhakaDateToIso, formatDateDhaka } from '@/utils/date';

export function TransactionListScreen() {
  const ledger = useLedger();
  const { banglaDigits } = useSettings();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [kind, setKind] = useState<TransactionKind | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [noteQuery, setNoteQuery] = useState('');
  const [fromDay, setFromDay] = useState<string | null>(null);
  const [toDay, setToDay] = useState<string | null>(null);

  if (ledger.loading) {
    return <EmptyScreen title={copy.allEntries} message={copy.loading} />;
  }

  if (ledger.error) {
    return (
      <Screen>
        <FormMessage message={ledger.error} />
        <PrimaryButton label={copy.retry} onPress={ledger.retry} />
      </Screen>
    );
  }

  const filtered = filterTransactions(ledger.transactions, {
    kind,
    accountId,
    categoryId,
    noteQuery,
    fromDay,
    toDay,
  });
  const groups = groupTransactionsByDay(filtered);

  return (
    <View style={styles.fill}>
      <Screen>
        <View style={styles.heading}>
          <TextButton label={copy.filter} onPress={() => setFiltersOpen((open) => !open)} />
          <PrimaryButton label={copy.newEntry} onPress={() => router.push({ pathname: '/transaction/new' })} />
        </View>
        {filtersOpen ? (
          <View style={styles.filters}>
            <FieldLabel label={copy.kind} />
            <ChipRow>
              <Chip label={copy.all} selected={kind == null} onPress={() => setKind(null)} />
              <Chip label={copy.expense} selected={kind === 'expense'} onPress={() => setKind('expense')} />
              <Chip label={copy.income} selected={kind === 'income'} onPress={() => setKind('income')} />
              <Chip label={copy.transfer} selected={kind === 'transfer'} onPress={() => setKind('transfer')} />
            </ChipRow>
            <FieldLabel label={copy.account} />
            <ChipRow>
              <Chip label={copy.all} selected={accountId == null} onPress={() => setAccountId(null)} />
              {ledger.accounts.map((account) => (
                <Chip
                  key={account.id}
                  label={account.name}
                  selected={accountId === account.id}
                  onPress={() => setAccountId(account.id)}
                />
              ))}
            </ChipRow>
            <FieldLabel label={copy.category} />
            <ChipRow>
              <Chip label={copy.all} selected={categoryId == null} onPress={() => setCategoryId(null)} />
              {ledger.categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={categoryId === category.id}
                  onPress={() => setCategoryId(category.id)}
                />
              ))}
            </ChipRow>
            <TextField label={copy.note} value={noteQuery} onChangeText={setNoteQuery} placeholder={copy.searchNotes} />
            <DayStepper label={copy.from} value={fromDay} onChange={setFromDay} optional />
            <DayStepper label={copy.to} value={toDay} onChange={setToDay} optional />
          </View>
        ) : null}
        {groups.length === 0 ? (
          <ThemedText themeColor="textSecondary">{copy.noTransactions}</ThemedText>
        ) : (
          groups.map((group) => {
            const [year, month, day] = group.dayKey.split('-').map(Number);
            return (
              <View key={group.dayKey} style={styles.group}>
                <View style={styles.heading}>
                  <ThemedText type="smallBold">
                    {formatDateDhaka(dhakaDateToIso(year, month, day), banglaDigits)}
                  </ThemedText>
                  <View style={styles.daily}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {copy.dailyTotal}
                    </ThemedText>
                    <MoneyText paisa={group.net} type="smallBold" />
                  </View>
                </View>
                {group.items.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    accounts={ledger.accounts}
                    categories={ledger.categories}
                    onPress={() =>
                      router.push({ pathname: '/transaction/[id]', params: { id: String(transaction.id) } })
                    }
                  />
                ))}
              </View>
            );
          })
        )}
      </Screen>
      <UndoBanner onRestored={ledger.retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  filters: {
    gap: Spacing.two,
  },
  group: {
    gap: Spacing.one,
  },
  daily: {
    alignItems: 'flex-end',
  },
});
