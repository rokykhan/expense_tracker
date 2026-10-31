import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { DebtDetailScreen } from '@/features/debts/components/debt-detail-screen';

export default function DebtDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.debtsTitle }} />
      <DebtDetailScreen debtId={Number.isInteger(debtId) ? debtId : -1} />
    </>
  );
}
