import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton, TextButton } from '@/components/form';
import { Meter } from '@/components/meter';
import { MoneyText } from '@/components/money-text';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { deleteDeposit, listDeposits, listGoals } from '@/features/savings/data/goals';
import type { DepositRecord, GoalRecord } from '@/features/savings/data/goals';
import { goalProgress } from '@/features/savings/domain/progress';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/providers/settings-provider';
import { toBanglaDigits } from '@/utils/bangla-digits';
import { formatDateDhaka } from '@/utils/date';
import { openPath } from '@/utils/navigation';

const NO_GOALS: GoalRecord[] = [];
const NO_DEPOSITS: DepositRecord[] = [];

export function GoalDetailScreen({ goalId }: { goalId: number }) {
  const db = useSQLiteContext();
  const goals = useDbQuery(listGoals, NO_GOALS);
  const deposits = useDbQuery(listDeposits, NO_DEPOSITS);
  const { banglaDigits } = useSettings();
  const [message, setMessage] = useState<string | null>(null);

  if (goals.loading || deposits.loading) {
    return <EmptyScreen title={copy.savingsTitle} message={copy.loading} />;
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
    return <EmptyScreen title={copy.savingsTitle} message={copy.notFound} />;
  }

  const rows = deposits.data.filter((row) => row.goalId === goal.id);
  const progress = goalProgress(goal.targetAmount, rows.map((row) => row.amount));
  const percent = Math.round(progress.ratio * 100);
  const percentText = banglaDigits ? toBanglaDigits(String(percent)) : String(percent);

  async function remove(depositId: number) {
    try {
      await deleteDeposit(db, depositId, goalId);
      deposits.retry();
    } catch (deleteError) {
      console.error(deleteError);
      setMessage(copy.dbError);
    }
  }

  return (
    <Screen>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.line}>
          <ThemedText type="smallBold">{goal.name}</ThemedText>
          <ThemedText type="small">{progress.completed ? copy.completed : `${percentText}%`}</ThemedText>
        </View>
        <Meter ratio={progress.ratio} tone="ok" />
        <View style={styles.line}>
          <ThemedText type="small">{copy.saved}</ThemedText>
          <MoneyText paisa={progress.saved} type="small" />
        </View>
        <View style={styles.line}>
          <ThemedText type="small">{copy.target}</ThemedText>
          <MoneyText paisa={goal.targetAmount} type="small" />
        </View>
      </ThemedView>
      <PrimaryButton label={copy.movement} onPress={() => openPath(`/savings/${goal.id}/deposit`)} />
      <TextButton label={copy.editGoal} onPress={() => openPath(`/savings/edit/${goal.id}`)} />
      {message ? <FormMessage message={message} /> : null}
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
          <TextButton label={copy.delete} onPress={() => void remove(row.id)} />
        </View>
      ))}
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
