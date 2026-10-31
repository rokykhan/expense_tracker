import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { GoalFormScreen } from '@/features/savings/components/goal-form-screen';

export default function EditGoalRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.editGoal }} />
      <GoalFormScreen goalId={Number.isInteger(goalId) ? goalId : -1} />
    </>
  );
}
