import type { TransactionRecord } from '@/features/transactions/domain/types';
import { transactionsInMonth } from '@/features/transactions/domain/ledger';

export type BudgetLevel = 'ok' | 'warning' | 'over';

export function expenseSpent(
  transactions: readonly TransactionRecord[],
  year: number,
  month: number,
  categoryId: number | null,
): number {
  return transactionsInMonth([...transactions], year, month)
    .filter((transaction) => transaction.kind === 'expense' && (categoryId == null || transaction.categoryId === categoryId))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function budgetLevel(spent: number, limit: number): BudgetLevel {
  if (limit <= 0) {
    return 'ok';
  }
  if (spent >= limit) {
    return 'over';
  }
  if (spent * 5 >= limit * 4) {
    return 'warning';
  }
  return 'ok';
}

export function budgetRatio(spent: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }
  return spent / limit;
}
