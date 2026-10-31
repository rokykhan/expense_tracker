import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { DebtListScreen } from '@/features/debts/components/debt-list-screen';

export default function DebtsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.debtsTitle }} />
      <DebtListScreen />
    </>
  );
}
