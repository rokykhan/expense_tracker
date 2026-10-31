import type { AccountType } from '@/db/types';

export type AccountRecord = {
  id: number;
  name: string;
  type: AccountType;
  initialBalance: number;
  icon: string;
  color: string;
  isArchived: boolean;
  sortOrder: number;
};

export type AccountInput = {
  id?: number;
  name: string;
  type: AccountType;
  initialBalance: number;
  icon: string;
  color: string;
  isArchived: boolean;
};
