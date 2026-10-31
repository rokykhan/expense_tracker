import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { QuickEntryFormScreen } from '@/features/quick-entry/components/quick-entry-form-screen';

export default function NewQuickEntryRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.newQuickEntry }} />
      <QuickEntryFormScreen entryId={null} />
    </>
  );
}
