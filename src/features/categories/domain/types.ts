import type { CategoryKind } from '@/db/types';

export type CategoryRecord = {
  id: number;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
};

export type CategoryInput = {
  id?: number;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
};
