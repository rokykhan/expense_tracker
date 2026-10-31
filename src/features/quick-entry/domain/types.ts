import type { TransactionKind } from '@/db/types';

export type QuickEntryRecord = {
  id: number;
  title: string;
  kind: TransactionKind;
  amount: number;
  accountId: number;
  categoryId: number;
  note: string | null;
  sortOrder: number;
};

export type QuickEntryInput = {
  id?: number;
  title: string;
  kind: TransactionKind;
  amount: number;
  accountId: number;
  categoryId: number;
  note: string | null;
};
