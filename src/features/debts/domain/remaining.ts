import type { DebtKind } from '@/db/types';

export function debtRemaining(amount: number, payments: readonly number[]): number {
  return amount - payments.reduce((sum, payment) => sum + payment, 0);
}

export function isOverdue(dueDate: string | null, today: string, isSettled: boolean, remaining: number): boolean {
  return !isSettled && remaining > 0 && dueDate != null && dueDate < today;
}

export type OpenDebt = {
  personName: string;
  kind: DebtKind;
  remaining: number;
  isSettled: boolean;
};

export function personOpenTotals(rows: readonly OpenDebt[]): { personName: string; kind: DebtKind; remaining: number }[] {
  const totals = new Map<string, { personName: string; kind: DebtKind; remaining: number }>();

  for (const row of rows) {
    if (row.isSettled || row.remaining <= 0) {
      continue;
    }
    const key = `${row.kind}\0${row.personName}`;
    const current = totals.get(key);
    if (current) {
      current.remaining += row.remaining;
    } else {
      totals.set(key, { personName: row.personName, kind: row.kind, remaining: row.remaining });
    }
  }

  return [...totals.values()];
}
