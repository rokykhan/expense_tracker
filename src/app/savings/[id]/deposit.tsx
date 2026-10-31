import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { DepositFormScreen } from '@/features/savings/components/deposit-form-screen';

export default function DepositRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.movement }} />
      <DepositFormScreen goalId={Number.isInteger(goalId) ? goalId : -1} />
    </>
  );
}
