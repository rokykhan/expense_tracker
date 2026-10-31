import type { TransactionKind } from '@/db/types';
import type { TransactionRecord } from '@/features/transactions/domain/types';
import {
  categoryBreakdown,
  monthTotals,
  transactionsInMonth,
} from '@/features/transactions/domain/ledger';
import { dhakaDayKey } from '@/utils/date';

export type AmountPoint = {
  key: number;
  amount: number;
};

export type YearMonth = {
  year: number;
  month: number;
  income: number;
  expense: number;
  net: number;
};

export type CategorySlice = {
  categoryId: number | null;
  amount: number;
};

export type CustomFilter = {
  fromDay: string | null;
  toDay: string | null;
  accountIds: number[];
  categoryIds: number[];
  kinds: TransactionKind[];
};

export function monthlySlices(
  transactions: TransactionRecord[],
  year: number,
  month: number,
  kind: 'income' | 'expense',
): CategorySlice[] {
  const shares = categoryBreakdown(transactions, year, month, kind);
  const categorized = shares.reduce((sum, share) => sum + share.amount, 0);
  const total = monthTotals(transactions, year, month)[kind];
  const slices: CategorySlice[] = shares.map((share) => ({
    categoryId: share.categoryId,
    amount: share.amount,
  }));
  if (total > categorized) {
    slices.push({ categoryId: null, amount: total - categorized });
  }
  return slices;
}

export function dailySeries(
  transactions: TransactionRecord[],
  year: number,
  month: number,
  kind: 'income' | 'expense',
): AmountPoint[] {
  const totals = new Map<number, number>();

  for (const transaction of transactionsInMonth(transactions, year, month)) {
    if (transaction.kind !== kind) {
      continue;
    }
    const day = Number(dhakaDayKey(transaction.occurredAt).slice(8));
    totals.set(day, (totals.get(day) ?? 0) + transaction.amount);
  }

  return [...totals.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([key, amount]) => ({ key, amount }));
}

export function yearMonths(transactions: TransactionRecord[], year: number): YearMonth[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const totals = monthTotals(transactions, year, month);
    return {
      year,
      month,
      income: totals.income,
      expense: totals.expense,
      net: totals.savings,
    };
  });
}

export function customRows(transactions: TransactionRecord[], filter: CustomFilter): TransactionRecord[] {
  if (filter.fromDay && filter.toDay && filter.fromDay > filter.toDay) {
    return [];
  }

  return transactions.filter((transaction) => {
    const day = dhakaDayKey(transaction.occurredAt);
    if (filter.fromDay && day < filter.fromDay) {
      return false;
    }
    if (filter.toDay && day > filter.toDay) {
      return false;
    }
    if (filter.kinds.length > 0 && !filter.kinds.includes(transaction.kind)) {
      return false;
    }
    if (
      filter.accountIds.length > 0 &&
      !filter.accountIds.includes(transaction.accountId) &&
      (transaction.toAccountId == null || !filter.accountIds.includes(transaction.toAccountId))
    ) {
      return false;
    }
    if (
      filter.categoryIds.length > 0 &&
      (transaction.categoryId == null || !filter.categoryIds.includes(transaction.categoryId))
    ) {
      return false;
    }
    return true;
  });
}

export function reportTotals(rows: TransactionRecord[]): { income: number; expense: number } {
  let income = 0;
  let expense = 0;

  for (const row of rows) {
    if (row.kind === 'income') {
      income += row.amount;
    } else if (row.kind === 'expense') {
      expense += row.amount;
    }
  }

  return { income, expense };
}

export function expenseSlices(rows: TransactionRecord[]): CategorySlice[] {
  const totals = new Map<string, CategorySlice>();

  for (const row of rows) {
    if (row.kind !== 'expense') {
      continue;
    }
    const key = row.categoryId == null ? 'none' : String(row.categoryId);
    const current = totals.get(key) ?? { categoryId: row.categoryId, amount: 0 };
    current.amount += row.amount;
    totals.set(key, current);
  }

  return [...totals.values()].sort(
    (left, right) => right.amount - left.amount || (left.categoryId ?? 0) - (right.categoryId ?? 0),
  );
}

export function sumAmounts(points: { amount: number }[]): number {
  return points.reduce((sum, point) => sum + point.amount, 0);
}

export function withPercents(slices: CategorySlice[]): (CategorySlice & { percent: number })[] {
  const total = sumAmounts(slices);
  if (total === 0) {
    return [];
  }

  const withFraction = slices.map((slice) => {
    const exact = (slice.amount * 100) / total;
    return { ...slice, percent: Math.floor(exact), fraction: exact - Math.floor(exact) };
  });
  let remainder = 100 - withFraction.reduce((sum, slice) => sum + slice.percent, 0);
  const byFraction = [...withFraction].sort(
    (left, right) => right.fraction - left.fraction || right.amount - left.amount,
  );
  for (const slice of byFraction) {
    if (remainder <= 0) {
      break;
    }
    slice.percent += 1;
    remainder -= 1;
  }

  return withFraction.map(({ categoryId, amount, percent }) => ({ categoryId, amount, percent }));
}
