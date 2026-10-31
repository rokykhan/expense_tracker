import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { RecurringFormScreen } from '@/features/recurring/components/recurring-form-screen';

export default function NewRecurringRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.newRecurring }} />
      <RecurringFormScreen ruleId={null} />
    </>
  );
}
