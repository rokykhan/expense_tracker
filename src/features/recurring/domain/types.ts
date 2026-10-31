import type { RecurringFrequency, TransactionKind } from '@/db/types';

export type RecurringRuleRecord = {
  id: number;
  kind: TransactionKind;
  amount: number;
  accountId: number;
  toAccountId: number | null;
  categoryId: number | null;
  note: string | null;
  frequency: RecurringFrequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  nextRunDate: string;
  isActive: boolean;
};

export type RecurringRuleInput = {
  id?: number;
  kind: TransactionKind;
  amount: number;
  accountId: number;
  toAccountId: number | null;
  categoryId: number | null;
  note: string | null;
  frequency: RecurringFrequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
};
