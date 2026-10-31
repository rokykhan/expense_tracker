import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import { DayStepper } from '@/components/day-stepper';
import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, NoteField, PrimaryButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { copy } from '@/constants/copy';
import { addPayment, listDebts, listPayments } from '@/features/debts/data/debts';
import type { DebtRecord, PaymentRecord } from '@/features/debts/data/debts';
import { debtRemaining } from '@/features/debts/domain/remaining';
import { useDbQuery } from '@/hooks/use-db-query';
import { dhakaDateToIso, todayDhakaDayKey } from '@/utils/date';
import { parseAmountToPaisa } from '@/utils/money';
import { leaveScreen } from '@/utils/navigation';

const NO_DEBTS: DebtRecord[] = [];
const NO_PAYMENTS: PaymentRecord[] = [];

export function PaymentFormScreen({ debtId }: { debtId: number }) {
  const debts = useDbQuery(listDebts, NO_DEBTS);
  const payments = useDbQuery(listPayments, NO_PAYMENTS);

  if (debts.loading || payments.loading) {
    return <EmptyScreen title={copy.newPayment} message={copy.loading} />;
  }

  if (debts.error || payments.error) {
    return (
      <Screen>
        <FormMessage message={debts.error ?? payments.error} />
        <PrimaryButton label={copy.retry} onPress={debts.error ? debts.retry : payments.retry} />
      </Screen>
    );
  }

  const debt = debts.data.find((row) => row.id === debtId) ?? null;
  if (!debt) {
    return <EmptyScreen title={copy.newPayment} message={copy.notFound} />;
  }

  const remaining = debtRemaining(
    debt.amount,
    payments.data.filter((row) => row.debtId === debtId).map((row) => row.amount),
  );
  return <PaymentEditor debtId={debtId} remaining={remaining} />;
}

function PaymentEditor({ debtId, remaining }: { debtId: number; remaining: number }) {
  const db = useSQLiteContext();
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
    if (amount > remaining) {
      setMessage(copy.paymentTooMuch);
      return;
    }
    const [year, month, day] = dayKey.split('-').map(Number);
    setSaving(true);
    try {
      await addPayment(db, {
        debtId,
        amount,
        occurredAt: dhakaDateToIso(year, month, day),
        note: note.trim().slice(0, 200) || null,
      });
      leaveScreen();
    } catch (saveError) {
      console.error(saveError);
      const code = saveError instanceof Error ? saveError.message : '';
      setMessage(code === 'overpay' ? copy.paymentTooMuch : copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TextField
        label={copy.amount}
        value={amountText}
        onChangeText={setAmountText}
        placeholder="0.00"
        keyboard="decimal-pad"
      />
      <DayStepper label={copy.date} value={dayKey} onChange={(next) => setDayKey(next ?? dayKey)} />
      <NoteField label={copy.note} value={note} onChangeText={setNote} />
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}
