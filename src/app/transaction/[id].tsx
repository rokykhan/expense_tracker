import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { TransactionFormScreen } from '@/features/transactions/components/transaction-form-screen';

export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactionId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.editEntry }} />
      <TransactionFormScreen transactionId={Number.isInteger(transactionId) ? transactionId : -1} />
    </>
  );
}
