import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { TransactionFormScreen } from '@/features/transactions/components/transaction-form-screen';

export default function NewTransactionRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.newEntry }} />
      <TransactionFormScreen transactionId={null} />
    </>
  );
}
