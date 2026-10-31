import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { TransactionListScreen } from '@/features/transactions/components/transaction-list-screen';

export default function TransactionListRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.allEntries }} />
      <TransactionListScreen />
    </>
  );
}
