import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { DayStepper } from '@/components/day-stepper';
import { EmptyScreen } from '@/components/empty-screen';
import { Chip, ChipRow, FieldLabel, FormMessage, NoteField, PrimaryButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { copy } from '@/constants/copy';
import { addDeposit, listDeposits, listGoals } from '@/features/savings/data/goals';
import type { DepositRecord, GoalRecord } from '@/features/savings/data/goals';
import { goalSaved, withdrawalAllowed } from '@/features/savings/domain/progress';
import { useDbQuery } from '@/hooks/use-db-query';
import { dhakaDateToIso, todayDhakaDayKey } from '@/utils/date';
import { parseAmountToPaisa } from '@/utils/money';
import { leaveScreen } from '@/utils/navigation';

const NO_GOALS: GoalRecord[] = [];
const NO_DEPOSITS: DepositRecord[] = [];

export function DepositFormScreen({ goalId }: { goalId: number }) {
  const goals = useDbQuery(listGoals, NO_GOALS);
  const deposits = useDbQuery(listDeposits, NO_DEPOSITS);

  if (goals.loading || deposits.loading) {
    return <EmptyScreen title={copy.movement} message={copy.loading} />;
  }

  if (goals.error || deposits.error) {
    return (
      <Screen>
        <FormMessage message={goals.error ?? deposits.error} />
        <PrimaryButton label={copy.retry} onPress={goals.error ? goals.retry : deposits.retry} />
      </Screen>
    );
  }

  const goal = goals.data.find((row) => row.id === goalId) ?? null;
  if (!goal) {
    return <EmptyScreen title={copy.movement} message={copy.notFound} />;
  }

  const saved = goalSaved(deposits.data.filter((row) => row.goalId === goalId).map((row) => row.amount));
  return <DepositEditor goalId={goalId} saved={saved} />;
}

function DepositEditor({ goalId, saved }: { goalId: number; saved: number }) {
  const db = useSQLiteContext();
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const [amountText, setAmountText] = useState('');
  const [dayKey, setDayKey] = useState(todayDhakaDayKey());
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const amount = parseAmountToPaisa(amountText);
    if (amount == null) {
      setMessage(copy.requiredAmount);
      return;
    }
    if (direction === 'withdraw' && !withdrawalAllowed(saved, amount)) {
      setMessage(copy.withdrawTooMuch);
      return;
    }
    const [year, month, day] = dayKey.split('-').map(Number);
    setSaving(true);
    try {
      await addDeposit(db, {
        goalId,
        amount: direction === 'withdraw' ? -amount : amount,
        occurredAt: dhakaDateToIso(year, month, day),
        note: note.trim().slice(0, 200) || null,
      });
      leaveScreen();
    } catch (saveError) {
      console.error(saveError);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View>
        <FieldLabel label={copy.kind} />
        <ChipRow>
          <Chip label={copy.deposit} selected={direction === 'deposit'} onPress={() => setDirection('deposit')} />
          <Chip label={copy.withdraw} selected={direction === 'withdraw'} onPress={() => setDirection('withdraw')} />
        </ChipRow>
      </View>
      <TextField
        label={copy.amount}
        value={amountText}
        onChangeText={setAmountText}
        placeholder="0.00"
        keyboard="decimal-pad"
      />
      <DayStepper
        label={copy.date}
        value={dayKey}
        onChange={(next) => setDayKey(next ?? dayKey)}
      />
      <NoteField label={copy.note} value={note} onChangeText={setNote} />
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}
