import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { GoalDetailScreen } from '@/features/savings/components/goal-detail-screen';

export default function GoalDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.savingsTitle }} />
      <GoalDetailScreen goalId={Number.isInteger(goalId) ? goalId : -1} />
    </>
  );
}
