import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { QuickEntryFormScreen } from '@/features/quick-entry/components/quick-entry-form-screen';

export default function EditQuickEntryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entryId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.editQuickEntry }} />
      <QuickEntryFormScreen entryId={Number.isInteger(entryId) ? entryId : -1} />
    </>
  );
}
