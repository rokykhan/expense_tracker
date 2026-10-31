import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { ProfileScreen } from '@/features/settings/components/profile-screen';

export default function SettingsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.profileTitle }} />
      <ProfileScreen />
    </>
  );
}
