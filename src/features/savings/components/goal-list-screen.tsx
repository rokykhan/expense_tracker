import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton } from '@/components/form';
import { Meter } from '@/components/meter';
import { MoneyText } from '@/components/money-text';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { listDeposits, listGoals } from '@/features/savings/data/goals';
import type { DepositRecord, GoalRecord } from '@/features/savings/data/goals';
import { goalProgress } from '@/features/savings/domain/progress';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/providers/settings-provider';
import { toBanglaDigits } from '@/utils/bangla-digits';
import { openPath } from '@/utils/navigation';

const NO_GOALS: GoalRecord[] = [];
const NO_DEPOSITS: DepositRecord[] = [];

export function GoalListScreen() {
  const goals = useDbQuery(listGoals, NO_GOALS);
  const deposits = useDbQuery(listDeposits, NO_DEPOSITS);
  const { banglaDigits } = useSettings();

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

  return (
    <Screen>
      <PrimaryButton label={copy.newGoal} onPress={() => openPath('/savings/new')} />
      {goals.data.length === 0 ? <ThemedText themeColor="textSecondary">{copy.goalEmpty}</ThemedText> : null}
      {goals.data.map((goal) => {
        const amounts = deposits.data.filter((row) => row.goalId === goal.id).map((row) => row.amount);
        const progress = goalProgress(goal.targetAmount, amounts);
        const percent = Math.round(progress.ratio * 100);
        const percentText = banglaDigits ? toBanglaDigits(String(percent)) : String(percent);
        return (
          <Pressable key={goal.id} accessibilityRole="button" onPress={() => openPath(`/savings/${goal.id}`)}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.line}>
                <ThemedText>{goal.name}</ThemedText>
                <ThemedText type="small">{progress.completed ? copy.completed : `${percentText}%`}</ThemedText>
              </View>
        <Meter ratio={progress.ratio} tone="ok" />
              <View style={styles.line}>
                <MoneyText paisa={progress.saved} type="small" />
                <MoneyText paisa={goal.targetAmount} type="small" />
              </View>
            </ThemedView>
          </Pressable>
        );
      })}
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
