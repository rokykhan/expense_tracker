import type { TransactionRecord } from '@/features/transactions/domain/types';
import { budgetLevel, expenseSpent } from '@/features/budgets/domain/progress';

function expense(categoryId: number, amount: number, occurredAt: string): TransactionRecord {
  return {
    id: amount,
    kind: 'expense',
    amount,
    accountId: 1,
    toAccountId: null,
    categoryId,
    note: null,
    occurredAt,
    recurringRuleId: null,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

describe('budget progress', () => {
  const january = '2026-01-15T06:00:00.000Z';
  const transactions = [
    expense(1, 8000, january),
    expense(2, 3000, january),
    { ...expense(1, 5000, january), kind: 'income' as const },
    expense(1, 9000, '2026-02-15T06:00:00.000Z'),
  ];

  it('counts this month’s expenses and matches a category', () => {
    expect(expenseSpent(transactions, 2026, 1, null)).toBe(11000);
    expect(expenseSpent(transactions, 2026, 1, 1)).toBe(8000);
    expect(expenseSpent(transactions, 2026, 2, null)).toBe(9000);
  });

  it('turns yellow at 80 percent and red at the limit', () => {
    expect(budgetLevel(7999, 10000)).toBe('ok');
    expect(budgetLevel(8000, 10000)).toBe('warning');
    expect(budgetLevel(10000, 10000)).toBe('over');
    expect(budgetLevel(10001, 10000)).toBe('over');
  });
});
