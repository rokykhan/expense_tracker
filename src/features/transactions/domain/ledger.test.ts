import {
  accountBalance,
  categoryBreakdown,
  filterTransactions,
  groupTransactionsByDay,
  monthTotals,
  totalBalance,
} from '@/features/transactions/domain/ledger';
import type { TransactionRecord } from '@/features/transactions/domain/types';

function entry(partial: Pick<TransactionRecord, 'id' | 'kind' | 'amount' | 'accountId' | 'occurredAt'> &
  Partial<TransactionRecord>): TransactionRecord {
  return {
    toAccountId: null,
    categoryId: partial.kind === 'expense' ? 1 : partial.kind === 'income' ? 2 : null,
    note: null,
    recurringRuleId: null,
    createdAt: partial.occurredAt,
    updatedAt: partial.occurredAt,
    ...partial,
  };
}

describe('account balances', () => {
  const cash = { id: 1, initialBalance: 0 };
  const bank = { id: 2, initialBalance: 50000 };
  const transactions = [
    entry({
      id: 1,
      kind: 'income',
      amount: 10000,
      accountId: 1,
      categoryId: 2,
      occurredAt: '2026-01-15T06:00:00.000Z',
    }),
    entry({
      id: 2,
      kind: 'expense',
      amount: 2500,
      accountId: 1,
      categoryId: 1,
      occurredAt: '2026-01-20T06:00:00.000Z',
    }),
    entry({
      id: 3,
      kind: 'transfer',
      amount: 1000,
      accountId: 1,
      toAccountId: 2,
      categoryId: null,
      occurredAt: '2026-01-21T06:00:00.000Z',
    }),
    entry({
      id: 4,
      kind: 'expense',
      amount: 500,
      accountId: 2,
      categoryId: 3,
      occurredAt: '2026-02-01T00:00:00.000Z',
    }),
  ];

  it('adds income, subtracts expenses, and moves transfers', () => {
    expect(accountBalance(cash, transactions)).toBe(6500);
    expect(accountBalance(bank, transactions)).toBe(50500);
  });

  it('keeps the total balance unchanged by a transfer', () => {
    const withoutTransfer = transactions.filter((item) => item.id !== 3);
    expect(totalBalance([cash, bank], transactions)).toBe(totalBalance([cash, bank], withoutTransfer));
  });

  it('counts an archived account in the total so transfers still net to zero', () => {
    expect(totalBalance([cash, { id: 2, initialBalance: 50000 }], transactions.filter((item) => item.id !== 4))).toBe(
      57500,
    );
  });

  it('treats savings as this month income minus expense', () => {
    expect(monthTotals(transactions, 2026, 1)).toEqual({
      income: 10000,
      expense: 2500,
      savings: 7500,
    });
    expect(monthTotals(transactions, 2026, 2)).toEqual({
      income: 0,
      expense: 500,
      savings: -500,
    });
  });

  it('splits category shares so the percentages add up to 100', () => {
    const shares = categoryBreakdown(
      [
        entry({ id: 1, kind: 'expense', amount: 1, accountId: 1, categoryId: 1, occurredAt: '2026-01-02T06:00:00.000Z' }),
        entry({ id: 2, kind: 'expense', amount: 1, accountId: 1, categoryId: 2, occurredAt: '2026-01-03T06:00:00.000Z' }),
        entry({ id: 3, kind: 'expense', amount: 1, accountId: 1, categoryId: 3, occurredAt: '2026-01-04T06:00:00.000Z' }),
      ],
      2026,
      1,
      'expense',
    );

    expect(shares.map((share) => share.percent).reduce((sum, percent) => sum + percent, 0)).toBe(100);
    expect(categoryBreakdown(transactions, 2026, 1, 'expense')).toEqual([
      { categoryId: 1, amount: 2500, percent: 100 },
    ]);
  });

  it('filters by note, kind, account, and Dhaka day', () => {
    const noted = entry({
      id: 9,
      kind: 'expense',
      amount: 300,
      accountId: 1,
      note: 'চা দোকান',
      occurredAt: '2026-01-18T06:00:00.000Z',
    });
    const rows = [...transactions, noted];

    expect(filterTransactions(rows, { noteQuery: 'চা' }).map((item) => item.id)).toEqual([9]);
    expect(filterTransactions(rows, { kind: 'transfer' }).map((item) => item.id)).toEqual([3]);
    expect(filterTransactions(rows, { accountId: 2 }).map((item) => item.id).sort()).toEqual([3, 4]);
    expect(filterTransactions(rows, { fromDay: '2026-02-01', toDay: '2026-02-28' }).map((item) => item.id)).toEqual([
      4,
    ]);
  });

  it('groups days with a net that ignores transfers', () => {
    const groups = groupTransactionsByDay(transactions.filter((item) => item.id !== 4));
    expect(groups.map((group) => group.dayKey)).toEqual(['2026-01-21', '2026-01-20', '2026-01-15']);
    expect(groups[0]).toMatchObject({ income: 0, expense: 0, net: 0 });
    expect(groups[1].net).toBe(-2500);
  });
});
