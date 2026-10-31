import type { SQLiteDatabase } from 'expo-sqlite';

import type { TransactionKind } from '@/db/types';
import type { TransactionRecord } from '@/features/transactions/domain/types';

type TransactionRow = {
  id: number;
  kind: TransactionKind;
  amount: number;
  account_id: number;
  to_account_id: number | null;
  category_id: number | null;
  note: string | null;
  occurred_at: string;
  recurring_rule_id: number | null;
  created_at: string;
  updated_at: string;
};

export type TransactionInput = {
  id?: number;
  kind: TransactionKind;
  amount: number;
  accountId: number;
  toAccountId: number | null;
  categoryId: number | null;
  note: string | null;
  occurredAt: string;
};

function mapTransaction(row: TransactionRow): TransactionRecord {
  return {
    id: row.id,
    kind: row.kind,
    amount: row.amount,
    accountId: row.account_id,
    toAccountId: row.to_account_id,
    categoryId: row.category_id,
    note: row.note,
    occurredAt: row.occurred_at,
    recurringRuleId: row.recurring_rule_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTransactions(db: SQLiteDatabase): Promise<TransactionRecord[]> {
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT id, kind, amount, account_id, to_account_id, category_id, note, occurred_at,
            recurring_rule_id, created_at, updated_at
     FROM transactions
     ORDER BY occurred_at DESC, id DESC`,
  );
  return rows.map(mapTransaction);
}

export async function saveTransaction(db: SQLiteDatabase, input: TransactionInput): Promise<void> {
  const now = new Date().toISOString();
  if (input.id == null) {
    await db.runAsync(
      `INSERT INTO transactions
        (kind, amount, account_id, to_account_id, category_id, note, occurred_at, recurring_rule_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      input.kind,
      input.amount,
      input.accountId,
      input.toAccountId,
      input.categoryId,
      input.note,
      input.occurredAt,
      now,
      now,
    );
    return;
  }

  await db.runAsync(
    `UPDATE transactions
     SET kind = ?, amount = ?, account_id = ?, to_account_id = ?, category_id = ?, note = ?,
         occurred_at = ?, updated_at = ?
     WHERE id = ?`,
    input.kind,
    input.amount,
    input.accountId,
    input.toAccountId,
    input.categoryId,
    input.note,
    input.occurredAt,
    now,
    input.id,
  );
}

export async function deleteTransaction(db: SQLiteDatabase, transactionId: number): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', transactionId);
}

export async function restoreTransaction(db: SQLiteDatabase, transaction: TransactionRecord): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions
      (id, kind, amount, account_id, to_account_id, category_id, note, occurred_at, recurring_rule_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    transaction.id,
    transaction.kind,
    transaction.amount,
    transaction.accountId,
    transaction.toAccountId,
    transaction.categoryId,
    transaction.note,
    transaction.occurredAt,
    transaction.recurringRuleId,
    transaction.createdAt,
    transaction.updatedAt,
  );
}
