import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { GoalFormScreen } from '@/features/savings/components/goal-form-screen';

export default function NewGoalRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.newGoal }} />
      <GoalFormScreen goalId={null} />
    </>
  );
}
