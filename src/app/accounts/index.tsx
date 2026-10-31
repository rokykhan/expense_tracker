import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { AccountListScreen } from '@/features/accounts/components/account-list-screen';

export default function AccountListRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.accountsTitle }} />
      <AccountListScreen />
    </>
  );
}
