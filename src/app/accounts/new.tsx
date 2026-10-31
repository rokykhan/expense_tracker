import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { AccountFormScreen } from '@/features/accounts/components/account-form-screen';

export default function NewAccountRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.newAccount }} />
      <AccountFormScreen accountId={null} />
    </>
  );
}
