import type { TransactionRecord } from '@/features/transactions/domain/types';

let pending: TransactionRecord | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function stageDeletedTransaction(transaction: TransactionRecord) {
  pending = transaction;
  emit();
}

export function peekDeletedTransaction() {
  return pending;
}

export function clearDeletedTransaction() {
  pending = null;
  emit();
}

export function subscribeDeletedTransaction(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
