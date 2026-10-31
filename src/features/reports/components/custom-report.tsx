import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DayStepper } from '@/components/day-stepper';
import { Chip, ChipRow, FormMessage, PrimaryButton } from '@/components/form';
import { MoneyText } from '@/components/money-text';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import type { TransactionKind } from '@/db/types';
import type { AccountRecord } from '@/features/accounts/domain/types';
import type { CategoryRecord } from '@/features/categories/domain/types';
import { CategoryPie } from '@/features/reports/components/report-charts';
import { exportCsvFile } from '@/features/reports/data/share-csv';
import { toCsv } from '@/features/reports/domain/csv';
import { customRows, expenseSlices, reportTotals } from '@/features/reports/domain/summary';
import type { TransactionRecord } from '@/features/transactions/domain/types';
import { useTheme } from '@/hooks/use-theme';
import { dhakaDayKey } from '@/utils/date';

const KINDS: TransactionKind[] = ['expense', 'income', 'transfer'];

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function kindLabel(kind: TransactionKind): string {
  if (kind === 'income') {
    return copy.income;
  }
  if (kind === 'expense') {
    return copy.expense;
  }
  return copy.transfer;
}

export function CustomReport({
  transactions,
  accounts,
  categories,
}: {
  transactions: TransactionRecord[];
  accounts: AccountRecord[];
  categories: CategoryRecord[];
}) {
  const theme = useTheme();
  const [fromDay, setFromDay] = useState<string | null>(null);
  const [toDay, setToDay] = useState<string | null>(null);
  const [accountIds, setAccountIds] = useState<number[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [kinds, setKinds] = useState<TransactionKind[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const inverted = Boolean(fromDay && toDay && fromDay > toDay);
  const rows = customRows(transactions, { fromDay, toDay, accountIds, categoryIds, kinds });
  const totals = reportTotals(rows);
  const slices = expenseSlices(rows);
  const visibleCategories = categories.filter((category) => kinds.length === 0 || kinds.includes(category.kind));

  function changeKinds(kind: TransactionKind) {
    const next = toggleValue(kinds, kind);
    setKinds(next);
    setCategoryIds((current) =>
      current.filter((id) => {
        const category = categories.find((item) => item.id === id);
        return category != null && (next.length === 0 || next.includes(category.kind));
      }),
    );
  }

  async function onExport() {
    setExporting(true);
    setExportError(null);
    const csv = toCsv(
      rows.map((row) => {
        const account = accounts.find((item) => item.id === row.accountId);
        const destination = row.toAccountId == null ? null : accounts.find((item) => item.id === row.toAccountId);
        const category = categories.find((item) => item.id === row.categoryId);
        const accountName = destination
          ? `${account?.name ?? copy.unknown} → ${destination.name}`
          : (account?.name ?? copy.unknown);
        return {
          day: dhakaDayKey(row.occurredAt),
          kind: kindLabel(row.kind),
          paisa: row.amount,
          account: accountName,
          category: category?.name ?? '',
          note: row.note ?? '',
        };
      }),
    );
    try {
      await exportCsvFile(csv);
    } catch (error) {
      console.error(error);
      setExportError(copy.exportError);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <DayStepper label={copy.fromDate} value={fromDay} onChange={setFromDay} optional />
      <DayStepper label={copy.toDate} value={toDay} onChange={setToDay} optional />
      <FormMessage message={inverted ? copy.endBeforeStart : null} />
      <ChipRow>
        <Chip label={copy.all} selected={kinds.length === 0} onPress={() => setKinds([])} />
        {KINDS.map((kind) => (
          <Chip
            key={kind}
            label={kindLabel(kind)}
            selected={kinds.includes(kind)}
            onPress={() => changeKinds(kind)}
          />
        ))}
      </ChipRow>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {copy.account}
      </ThemedText>
      <ChipRow>
        <Chip label={copy.all} selected={accountIds.length === 0} onPress={() => setAccountIds([])} />
        {accounts.map((account) => (
          <Chip
            key={account.id}
            label={account.name}
            selected={accountIds.includes(account.id)}
            onPress={() => setAccountIds((current) => toggleValue(current, account.id))}
          />
        ))}
      </ChipRow>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {copy.category}
      </ThemedText>
      <ChipRow>
        <Chip label={copy.all} selected={categoryIds.length === 0} onPress={() => setCategoryIds([])} />
        {visibleCategories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            selected={categoryIds.includes(category.id)}
            onPress={() => setCategoryIds((current) => toggleValue(current, category.id))}
          />
        ))}
      </ChipRow>
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
      {rows.length === 0 ? (
        <ThemedText themeColor="textSecondary">{copy.reportRangeEmpty}</ThemedText>
      ) : (
        <CategoryPie
          slices={slices.map((slice) => ({
            value: slice.amount,
            color: categories.find((item) => item.id === slice.categoryId)?.color ?? theme.textSecondary,
          }))}
        />
      )}
      <PrimaryButton label={copy.exportCsv} onPress={() => void onExport()} disabled={exporting || rows.length === 0} />
      <FormMessage message={exportError} />
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
});
