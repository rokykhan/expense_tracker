import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { RecurringFormScreen } from '@/features/recurring/components/recurring-form-screen';

export default function EditRecurringRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ruleId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.editRecurring }} />
      <RecurringFormScreen ruleId={Number.isInteger(ruleId) ? ruleId : -1} />
    </>
  );
}
