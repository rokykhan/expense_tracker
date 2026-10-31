import { EmptyScreen } from '@/components/empty-screen';
import { copy } from '@/constants/copy';

export default function BudgetScreen() {
  return <EmptyScreen title={copy.tabs.budget} message={copy.budgetEmpty} />;
}
