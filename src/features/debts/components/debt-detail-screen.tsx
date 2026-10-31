import { type Href, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton, TextButton } from '@/components/form';
import { MeterTone } from '@/components/meter';
import { MoneyText } from '@/components/money-text';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { deleteDebt, deletePayment, listDebts, listPayments, settleDebt } from '@/features/debts/data/debts';
import type { DebtRecord, PaymentRecord } from '@/features/debts/data/debts';
import { debtRemaining, isOverdue } from '@/features/debts/domain/remaining';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/providers/settings-provider';
import { formatDateDhaka, todayDhakaDayKey } from '@/utils/date';
import { openPath } from '@/utils/navigation';

const NO_DEBTS: DebtRecord[] = [];
const NO_PAYMENTS: PaymentRecord[] = [];

export function DebtDetailScreen({ debtId }: { debtId: number }) {
  const db = useSQLiteContext();
  const debts = useDbQuery(listDebts, NO_DEBTS);
  const payments = useDbQuery(listPayments, NO_PAYMENTS);
  const { banglaDigits } = useSettings();
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  if (debts.loading || payments.loading) {
    return <EmptyScreen title={copy.debtsTitle} message={copy.loading} />;
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
    return <EmptyScreen title={copy.debtsTitle} message={copy.notFound} />;
  }

  const rows = payments.data.filter((row) => row.debtId === debt.id);
  const remaining = debtRemaining(debt.amount, rows.map((row) => row.amount));
  const overdue = isOverdue(debt.dueDate, todayDhakaDayKey(), debt.isSettled, remaining);

  async function settle() {
    setSaving(true);
    try {
      await settleDebt(db, debtId);
      debts.retry();
      setSaving(false);
    } catch (settleError) {
      console.error(settleError);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  async function removePayment(paymentId: number) {
    try {
      await deletePayment(db, paymentId, debtId);
      payments.retry();
      debts.retry();
    } catch (deleteError) {
      console.error(deleteError);
      setMessage(copy.dbError);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await deleteDebt(db, debtId);
      router.dismissTo('/debts' as Href);
    } catch (deleteError) {
      console.error(deleteError);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{debt.personName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {debt.kind === 'borrowed' ? copy.payable : copy.receivable}
          {debt.isSettled ? ` · ${copy.settled}` : ''}
        </ThemedText>
        <View style={styles.line}>
          <ThemedText>{copy.remaining}</ThemedText>
          <MoneyText paisa={remaining} />
        </View>
        {overdue ? <ThemedText style={{ color: MeterTone.over }}>{copy.overdue}</ThemedText> : null}
      </ThemedView>
      {message ? <FormMessage message={message} /> : null}
      {debt.isSettled ? null : (
        <PrimaryButton label={copy.newPayment} onPress={() => openPath(`/debts/${debt.id}/pay`)} />
      )}
      {debt.isSettled ? null : <PrimaryButton label={copy.settle} onPress={() => void settle()} disabled={saving} />}
      <TextButton label={copy.editDebt} onPress={() => openPath(`/debts/edit/${debt.id}`)} />
      {rows.map((row) => (
        <View key={row.id} style={styles.line}>
          <View>
            <ThemedText>{formatDateDhaka(row.occurredAt, banglaDigits)}</ThemedText>
            {row.note ? (
              <ThemedText type="small" themeColor="textSecondary">
                {row.note}
              </ThemedText>
            ) : null}
          </View>
          <MoneyText paisa={row.amount} />
          <TextButton label={copy.delete} onPress={() => void removePayment(row.id)} />
        </View>
      ))}
      {!confirming ? <TextButton label={copy.delete} onPress={() => setConfirming(true)} /> : null}
      {confirming ? (
        <View>
          <ThemedText>{copy.deleteDebtPrompt}</ThemedText>
          <PrimaryButton label={copy.confirm} onPress={() => void remove()} disabled={saving} />
          <TextButton label={copy.cancel} onPress={() => setConfirming(false)} />
        </View>
      ) : null}
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
});
