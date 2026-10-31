import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton, TextButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import { deleteBudget, listBudgets, saveBudget } from '@/features/budgets/data/budgets';
import type { BudgetRecord } from '@/features/budgets/data/budgets';
import { useDbQuery } from '@/hooks/use-db-query';
import { paisaToInput, parseAmountToPaisa } from '@/utils/money';
import { leaveScreen } from '@/utils/navigation';

const EMPTY: BudgetRecord[] = [];

export function BudgetFormScreen({ budgetKey }: { budgetKey: string }) {
  const parsed = parseBudgetKey(budgetKey);
  const budgets = useDbQuery(listBudgets, EMPTY);

  if (!parsed) {
    return <EmptyScreen title={copy.setBudget} message={copy.notFound} />;
  }

  if (budgets.loading) {
    return <EmptyScreen title={copy.setBudget} message={copy.loading} />;
  }

  if (budgets.error) {
    return (
      <Screen>
        <FormMessage message={budgets.error} />
        <PrimaryButton label={copy.retry} onPress={budgets.retry} />
      </Screen>
    );
  }

  const existing =
    budgets.data.find(
      (row) =>
        row.year === parsed.year &&
        row.month === parsed.month &&
        (parsed.categoryId == null ? row.categoryId == null : row.categoryId === parsed.categoryId),
    ) ?? null;

  return <BudgetEditor parsed={parsed} existing={existing} />;
}

function BudgetEditor({
  parsed,
  existing,
}: {
  parsed: { year: number; month: number; categoryId: number | null };
  existing: BudgetRecord | null;
}) {
  const db = useSQLiteContext();
  const [amountText, setAmountText] = useState(existing ? paisaToInput(existing.amount) : '');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const amount = parseAmountToPaisa(amountText);
    if (amount == null) {
      setMessage(copy.requiredAmount);
      return;
    }
    setSaving(true);
    try {
      await saveBudget(db, { ...parsed, amount });
      leaveScreen();
    } catch (saveError) {
      console.error(saveError);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) {
      return;
    }
    setSaving(true);
    try {
      await deleteBudget(db, existing.id);
      leaveScreen();
    } catch (deleteError) {
      console.error(deleteError);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ThemedText>{parsed.categoryId == null ? copy.overallBudget : copy.category}</ThemedText>
      <TextField
        label={copy.amount}
        value={amountText}
        onChangeText={setAmountText}
        placeholder="0.00"
        keyboard="decimal-pad"
      />
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
      {existing ? <TextButton label={copy.delete} onPress={() => void remove()} /> : null}
    </Screen>
  );
}

export function parseBudgetKey(value: string): { year: number; month: number; categoryId: number | null } | null {
  const match = value.match(/^(\d{4})-(\d{1,2})-(overall|\d+)$/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }
  return { year, month, categoryId: match[3] === 'overall' ? null : Number(match[3]) };
}
