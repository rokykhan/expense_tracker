import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton } from '@/components/form';
import { MoneyText } from '@/components/money-text';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { MeterTone } from '@/components/meter';
import { Spacing } from '@/constants/theme';
import { listDebts, listPayments } from '@/features/debts/data/debts';
import type { DebtRecord, PaymentRecord } from '@/features/debts/data/debts';
import { debtRemaining, isOverdue, personOpenTotals } from '@/features/debts/domain/remaining';
import type { DebtKind } from '@/db/types';
import { useDbQuery } from '@/hooks/use-db-query';
import { todayDhakaDayKey } from '@/utils/date';
import { openPath } from '@/utils/navigation';

const NO_DEBTS: DebtRecord[] = [];
const NO_PAYMENTS: PaymentRecord[] = [];

export function DebtListScreen() {
  const debts = useDbQuery(listDebts, NO_DEBTS);
  const payments = useDbQuery(listPayments, NO_PAYMENTS);
  const today = todayDhakaDayKey();

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

  const rows = debts.data.map((debt) => ({
    debt,
    remaining: debtRemaining(
      debt.amount,
      payments.data.filter((payment) => payment.debtId === debt.id).map((payment) => payment.amount),
    ),
  }));
  const totals = personOpenTotals(
    rows.map((row) => ({
      personName: row.debt.personName,
      kind: row.debt.kind,
      remaining: row.remaining,
      isSettled: row.debt.isSettled,
    })),
  );

  return (
    <Screen>
      <PrimaryButton label={copy.newDebt} onPress={() => openPath('/debts/new')} />
      {debts.data.length === 0 ? <ThemedText themeColor="textSecondary">{copy.debtEmpty}</ThemedText> : null}
      <DebtSection
        title={copy.payable}
        kind="borrowed"
        rows={rows}
        totals={totals}
        today={today}
      />
      <DebtSection title={copy.receivable} kind="lent" rows={rows} totals={totals} today={today} />
      <SettledSection rows={rows} />
    </Screen>
  );
}

function DebtSection({
  title,
  kind,
  rows,
  totals,
  today,
}: {
  title: string;
  kind: DebtKind;
  rows: { debt: DebtRecord; remaining: number }[];
  totals: { personName: string; kind: DebtKind; remaining: number }[];
  today: string;
}) {
  const open = rows.filter((row) => row.debt.kind === kind && !row.debt.isSettled);
  if (open.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {totals
        .filter((row) => row.kind === kind)
        .map((row) => (
          <View key={row.personName} style={styles.line}>
            <ThemedText type="small" themeColor="textSecondary">
              {row.personName}
            </ThemedText>
            <MoneyText paisa={row.remaining} type="small" />
          </View>
        ))}
      {open.map((row) => {
        const overdue = isOverdue(row.debt.dueDate, today, row.debt.isSettled, row.remaining);
        return (
          <Pressable key={row.debt.id} accessibilityRole="button" onPress={() => openPath(`/debts/${row.debt.id}`)}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.line}>
                <ThemedText>{row.debt.personName}</ThemedText>
                <MoneyText paisa={row.remaining} />
              </View>
              {overdue ? <ThemedText style={{ color: MeterTone.over }}>{copy.overdue}</ThemedText> : null}
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettledSection({ rows }: { rows: { debt: DebtRecord; remaining: number }[] }) {
  const settled = rows.filter((row) => row.debt.isSettled);
  if (settled.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {copy.settled}
      </ThemedText>
      {settled.map((row) => (
        <Pressable key={row.debt.id} accessibilityRole="button" onPress={() => openPath(`/debts/${row.debt.id}`)}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.line}>
              <ThemedText>{row.debt.personName}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {row.debt.kind === 'borrowed' ? copy.payable : copy.receivable}
              </ThemedText>
            </View>
          </ThemedView>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
