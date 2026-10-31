import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { QuickEntryListScreen } from '@/features/quick-entry/components/quick-entry-list-screen';

export default function QuickEntryListRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.quickEntries }} />
      <QuickEntryListScreen />
    </>
  );
}
