import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton } from '@/components/form';
import { Meter } from '@/components/meter';
import { MoneyText } from '@/components/money-text';
import { MonthSwitcher } from '@/components/month-switcher';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { copyBudgetsFromMonth, listBudgets } from '@/features/budgets/data/budgets';
import type { BudgetRecord } from '@/features/budgets/data/budgets';
import { budgetLevel, budgetRatio, expenseSpent } from '@/features/budgets/domain/progress';
import { useLedger } from '@/features/transactions/data/use-ledger';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/providers/settings-provider';
import { toBanglaDigits } from '@/utils/bangla-digits';
import { currentDhakaMonth, shiftMonth } from '@/utils/date';
import { openPath } from '@/utils/navigation';

const EMPTY: BudgetRecord[] = [];

export function BudgetScreen() {
  const db = useSQLiteContext();
  const ledger = useLedger();
  const budgets = useDbQuery(listBudgets, EMPTY);
  const { banglaDigits } = useSettings();
  const [month, setMonth] = useState(() => currentDhakaMonth());
  const [message, setMessage] = useState<string | null>(null);

  if (ledger.loading || budgets.loading) {
    return <EmptyScreen title={copy.tabs.budget} message={copy.loading} />;
  }

  if (ledger.error || budgets.error) {
    return (
      <Screen tabBar>
        <FormMessage message={ledger.error ?? budgets.error} />
        <PrimaryButton label={copy.retry} onPress={ledger.error ? ledger.retry : budgets.retry} />
      </Screen>
    );
  }

  const current = budgets.data.filter((row) => row.year === month.year && row.month === month.month);
  const previousMonth = shiftMonth(month.year, month.month, -1);
  const previous = budgets.data.filter((row) => row.year === previousMonth.year && row.month === previousMonth.month);
  const overall = current.find((row) => row.categoryId == null) ?? null;
  const expenseCategories = ledger.categories.filter((category) => category.kind === 'expense');

  async function copyPrevious() {
    try {
      await copyBudgetsFromMonth(db, previousMonth, month);
      budgets.retry();
      setMessage(null);
    } catch (copyError) {
      console.error(copyError);
      setMessage(copy.dbError);
    }
  }

  return (
    <Screen tabBar>
      <MonthSwitcher year={month.year} month={month.month} onChange={setMonth} />
      {message ? <FormMessage message={message} /> : null}
      {previous.length > 0 ? <PrimaryButton label={copy.copyLastMonth} onPress={() => void copyPrevious()} /> : null}
      <BudgetRow
        title={copy.overallBudget}
        spent={expenseSpent(ledger.transactions, month.year, month.month, null)}
        limit={overall?.amount ?? null}
        banglaDigits={banglaDigits}
        onPress={() => openPath(`/budgets/${month.year}-${month.month}-overall`)}
      />
      {expenseCategories.map((category) => {
        const row = current.find((item) => item.categoryId === category.id) ?? null;
        return (
          <BudgetRow
            key={category.id}
            title={category.name}
            spent={expenseSpent(ledger.transactions, month.year, month.month, category.id)}
            limit={row?.amount ?? null}
            banglaDigits={banglaDigits}
            onPress={() => openPath(`/budgets/${month.year}-${month.month}-${category.id}`)}
          />
        );
      })}
    </Screen>
  );
}

function BudgetRow({
  title,
  spent,
  limit,
  banglaDigits,
  onPress,
}: {
  title: string;
  spent: number;
  limit: number | null;
  banglaDigits: boolean;
  onPress: () => void;
}) {
  const level = limit == null ? 'ok' : budgetLevel(spent, limit);
  const ratio = limit == null ? 0 : budgetRatio(spent, limit);
  const percent = Math.round(ratio * 100);
  const percentText = banglaDigits ? toBanglaDigits(String(percent)) : String(percent);

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.line}>
          <ThemedText>{title}</ThemedText>
          <ThemedText type="small">{limit == null ? copy.noBudget : `${percentText}%`}</ThemedText>
        </View>
        {limit == null ? null : <Meter ratio={ratio} tone={level} />}
        <View style={styles.line}>
          <ThemedText type="small" themeColor="textSecondary">
            {copy.budgetSpent}
          </ThemedText>
          <MoneyText paisa={-spent} type="small" />
        </View>
        {limit == null ? null : (
          <View style={styles.line}>
            <ThemedText type="small" themeColor="textSecondary">
              {level === 'over' ? copy.overBudget : copy.budgetLeft}
            </ThemedText>
            <MoneyText paisa={level === 'over' ? spent - limit : limit - spent} type="small" />
          </View>
        )}
      </ThemedView>
    </Pressable>
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
