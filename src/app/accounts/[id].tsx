import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { AccountFormScreen } from '@/features/accounts/components/account-form-screen';

export default function EditAccountRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accountId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.editAccount }} />
      <AccountFormScreen accountId={Number.isInteger(accountId) ? accountId : -1} />
    </>
  );
}
