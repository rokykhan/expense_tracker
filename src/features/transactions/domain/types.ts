import type { TransactionKind } from '@/db/types';

export type TransactionRecord = {
  id: number;
  kind: TransactionKind;
  amount: number;
  accountId: number;
  toAccountId: number | null;
  categoryId: number | null;
  note: string | null;
  occurredAt: string;
  recurringRuleId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type { TransactionKind };
