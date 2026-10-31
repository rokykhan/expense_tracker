import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { DebtFormScreen } from '@/features/debts/components/debt-form-screen';

export default function EditDebtRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.editDebt }} />
      <DebtFormScreen debtId={Number.isInteger(debtId) ? debtId : -1} />
    </>
  );
}
