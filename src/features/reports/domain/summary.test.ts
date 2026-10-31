import {
  customRows,
  dailySeries,
  expenseSlices,
  monthlySlices,
  reportTotals,
  withPercents,
  sumAmounts,
  yearMonths,
} from '@/features/reports/domain/summary';
import { monthTotals } from '@/features/transactions/domain/ledger';
import type { TransactionRecord } from '@/features/transactions/domain/types';

function entry(
  partial: Pick<TransactionRecord, 'id' | 'kind' | 'amount' | 'accountId' | 'occurredAt'> &
    Partial<TransactionRecord>,
): TransactionRecord {
  return {
    toAccountId: null,
    categoryId: partial.kind === 'transfer' ? null : 1,
    note: null,
    recurringRuleId: null,
    createdAt: partial.occurredAt,
    updatedAt: partial.occurredAt,
    ...partial,
  };
}

const rows = [
  entry({ id: 1, kind: 'expense', amount: 2000, accountId: 1, categoryId: 1, occurredAt: '2026-11-01T02:00:00.000Z' }),
  entry({ id: 2, kind: 'expense', amount: 2000, accountId: 1, categoryId: 1, occurredAt: '2026-11-01T04:00:00.000Z' }),
  entry({ id: 3, kind: 'expense', amount: 10000, accountId: 1, categoryId: 4, occurredAt: '2026-11-01T08:00:00.000Z' }),
  entry({ id: 4, kind: 'expense', amount: 2000, accountId: 1, categoryId: null, occurredAt: '2026-11-02T02:00:00.000Z' }),
  entry({ id: 5, kind: 'income', amount: 5000, accountId: 1, categoryId: 2, occurredAt: '2026-11-03T02:00:00.000Z' }),
  entry({ id: 6, kind: 'expense', amount: 5000, accountId: 2, categoryId: 3, occurredAt: '2026-10-31T02:00:00.000Z' }),
  entry({
    id: 7,
    kind: 'transfer',
    amount: 1000,
    accountId: 1,
    toAccountId: 2,
    categoryId: null,
    occurredAt: '2026-11-04T02:00:00.000Z',
  }),
];

describe('report series', () => {
  it('keeps the pie and the daily bars equal to the month total', () => {
    const totals = monthTotals(rows, 2026, 11);
    const slices = monthlySlices(rows, 2026, 11, 'expense');
    expect(sumAmounts(slices)).toBe(totals.expense);
    expect(withPercents(slices).reduce((sum, slice) => sum + slice.percent, 0)).toBe(100);
    expect(sumAmounts(dailySeries(rows, 2026, 11, 'expense'))).toBe(totals.expense);
    expect(dailySeries(rows, 2026, 11, 'expense').map((point) => point.key)).toEqual([1, 2]);
  });

  it('returns twelve months whose expenses add up to the year', () => {
    const months = yearMonths(rows, 2026);
    expect(months).toHaveLength(12);
    const yearExpense = months.reduce((sum, month) => sum + month.expense, 0);
    const fromMonths = Array.from({ length: 12 }, (_, index) => monthTotals(rows, 2026, index + 1).expense).reduce(
      (sum, amount) => sum + amount,
      0,
    );
    expect(yearExpense).toBe(fromMonths);
    expect(months[9].expense).toBe(5000);
    expect(months[10].expense).toBe(16000);
    expect(months[10].net).toBe(5000 - 16000);
  });

  it('filters a custom range and keeps the expense slices on that total', () => {
    const filtered = customRows(rows, {
      fromDay: '2026-11-01',
      toDay: '2026-11-02',
      accountIds: [1],
      categoryIds: [],
      kinds: ['expense'],
    });
    const totals = reportTotals(filtered);
    expect(filtered.map((row) => row.id)).toEqual([1, 2, 3, 4]);
    expect(totals.expense).toBe(16000);
    expect(sumAmounts(expenseSlices(filtered))).toBe(totals.expense);
  });

  it('treats an empty selection as every row and drops an inverted range', () => {
    expect(customRows(rows, { fromDay: null, toDay: null, accountIds: [], categoryIds: [], kinds: [] })).toHaveLength(
      rows.length,
    );
    expect(
      customRows(rows, {
        fromDay: '2026-12-01',
        toDay: '2026-11-01',
        accountIds: [],
        categoryIds: [],
        kinds: [],
      }),
    ).toEqual([]);
  });
});
