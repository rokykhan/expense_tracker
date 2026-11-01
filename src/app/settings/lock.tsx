import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { LockSetupScreen } from '@/features/lock/components/lock-setup-screen';

export default function LockSettingsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.appLock }} />
      <LockSetupScreen />
    </>
  );
}
