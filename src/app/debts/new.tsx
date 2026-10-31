import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { DebtFormScreen } from '@/features/debts/components/debt-form-screen';

export default function NewDebtRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.newDebt }} />
      <DebtFormScreen debtId={null} />
    </>
  );
}
