import { dhakaDayKey, dhakaMonthBounds } from '@/utils/date';

import type { TransactionRecord } from '@/features/transactions/domain/types';

export type LedgerAccount = {
  id: number;
  initialBalance: number;
};

export type TransactionFilter = {
  fromDay?: string | null;
  toDay?: string | null;
  kind?: TransactionRecord['kind'] | null;
  categoryId?: number | null;
  accountId?: number | null;
  noteQuery?: string;
};

export type DayGroup<T> = {
  dayKey: string;
  income: number;
  expense: number;
  net: number;
  items: T[];
};

export type CategoryShare = {
  categoryId: number;
  amount: number;
  percent: number;
};

export function accountBalance(account: LedgerAccount, transactions: TransactionRecord[]): number {
  let balance = account.initialBalance;

  for (const transaction of transactions) {
    if (transaction.kind === 'income' && transaction.accountId === account.id) {
      balance += transaction.amount;
    } else if (transaction.kind === 'expense' && transaction.accountId === account.id) {
      balance -= transaction.amount;
    } else if (transaction.kind === 'transfer') {
      if (transaction.accountId === account.id) {
        balance -= transaction.amount;
      }
      if (transaction.toAccountId === account.id) {
        balance += transaction.amount;
      }
    }
  }

  return balance;
}

export function totalBalance(accounts: LedgerAccount[], transactions: TransactionRecord[]): number {
  return accounts.reduce((sum, account) => sum + accountBalance(account, transactions), 0);
}

export function monthTotals(
  transactions: TransactionRecord[],
  year: number,
  month: number,
): { income: number; expense: number; savings: number } {
  const { startMs, endMs } = dhakaMonthBounds(year, month);
  let income = 0;
  let expense = 0;

  for (const transaction of transactions) {
    const time = Date.parse(transaction.occurredAt);
    if (time < startMs || time >= endMs) {
      continue;
    }
    if (transaction.kind === 'income') {
      income += transaction.amount;
    } else if (transaction.kind === 'expense') {
      expense += transaction.amount;
    }
  }

  return { income, expense, savings: income - expense };
}

export function transactionsInMonth(
  transactions: TransactionRecord[],
  year: number,
  month: number,
): TransactionRecord[] {
  const { startMs, endMs } = dhakaMonthBounds(year, month);
  return transactions.filter((transaction) => {
    const time = Date.parse(transaction.occurredAt);
    return time >= startMs && time < endMs;
  });
}

export function categoryBreakdown(
  transactions: TransactionRecord[],
  year: number,
  month: number,
  kind: 'income' | 'expense',
): CategoryShare[] {
  const { startMs, endMs } = dhakaMonthBounds(year, month);
  const totals = new Map<number, number>();

  for (const transaction of transactions) {
    if (transaction.kind !== kind || transaction.categoryId == null) {
      continue;
    }
    const time = Date.parse(transaction.occurredAt);
    if (time < startMs || time >= endMs) {
      continue;
    }
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount);
  }

  const rows = [...totals.entries()].map(([categoryId, amount]) => ({ categoryId, amount }));
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  if (total === 0) {
    return [];
  }

  const withFraction = rows.map((row) => {
    const exact = (row.amount * 100) / total;
    return { ...row, percent: Math.floor(exact), fraction: exact - Math.floor(exact) };
  });
  let remainder = 100 - withFraction.reduce((sum, row) => sum + row.percent, 0);
  const byFraction = [...withFraction].sort(
    (left, right) => right.fraction - left.fraction || right.amount - left.amount,
  );
  for (const row of byFraction) {
    if (remainder <= 0) {
      break;
    }
    row.percent += 1;
    remainder -= 1;
  }

  return withFraction
    .map(({ categoryId, amount, percent }) => ({ categoryId, amount, percent }))
    .sort((left, right) => right.amount - left.amount || left.categoryId - right.categoryId);
}

export function filterTransactions(
  transactions: TransactionRecord[],
  filter: TransactionFilter,
): TransactionRecord[] {
  const query = filter.noteQuery?.trim() ?? '';

  return transactions.filter((transaction) => {
    const day = dhakaDayKey(transaction.occurredAt);
    if (filter.fromDay && day < filter.fromDay) {
      return false;
    }
    if (filter.toDay && day > filter.toDay) {
      return false;
    }
    if (filter.kind && transaction.kind !== filter.kind) {
      return false;
    }
    if (filter.categoryId != null && transaction.categoryId !== filter.categoryId) {
      return false;
    }
    if (
      filter.accountId != null &&
      transaction.accountId !== filter.accountId &&
      transaction.toAccountId !== filter.accountId
    ) {
      return false;
    }
    if (query && !(transaction.note ?? '').includes(query)) {
      return false;
    }
    return true;
  });
}

export function groupTransactionsByDay(transactions: TransactionRecord[]): DayGroup<TransactionRecord>[] {
  const sorted = [...transactions].sort(
    (left, right) => right.occurredAt.localeCompare(left.occurredAt) || right.id - left.id,
  );
  const groups: DayGroup<TransactionRecord>[] = [];

  for (const transaction of sorted) {
    const dayKey = dhakaDayKey(transaction.occurredAt);
    let group = groups.find((item) => item.dayKey === dayKey);
    if (!group) {
      group = { dayKey, income: 0, expense: 0, net: 0, items: [] };
      groups.push(group);
    }
    group.items.push(transaction);
    if (transaction.kind === 'income') {
      group.income += transaction.amount;
    } else if (transaction.kind === 'expense') {
      group.expense += transaction.amount;
    }
    group.net = group.income - group.expense;
  }

  return groups;
}

export function recentTransactions(transactions: TransactionRecord[], limit: number): TransactionRecord[] {
  return [...transactions]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || right.id - left.id)
    .slice(0, limit);
}
