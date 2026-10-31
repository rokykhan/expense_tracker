import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { PaymentFormScreen } from '@/features/debts/components/payment-form-screen';

export default function PaymentRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.newPayment }} />
      <PaymentFormScreen debtId={Number.isInteger(debtId) ? debtId : -1} />
    </>
  );
}
