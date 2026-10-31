import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { GoalListScreen } from '@/features/savings/components/goal-list-screen';

export default function SavingsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.savingsTitle }} />
      <GoalListScreen />
    </>
  );
}
