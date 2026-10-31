import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { RecurringListScreen } from '@/features/recurring/components/recurring-list-screen';

export default function RecurringListRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.recurringTitle }} />
      <RecurringListScreen />
    </>
  );
}
