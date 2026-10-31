import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { BudgetFormScreen } from '@/features/budgets/components/budget-form-screen';

export default function BudgetFormRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: copy.setBudget }} />
      <BudgetFormScreen budgetKey={id ?? ''} />
    </>
  );
}
