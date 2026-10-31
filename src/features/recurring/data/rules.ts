import type { SQLiteDatabase } from 'expo-sqlite';

import type { RecurringFrequency, TransactionKind } from '@/db/types';
import type { RecurringRuleInput, RecurringRuleRecord } from '@/features/recurring/domain/types';

type RecurringRuleRow = {
  id: number;
  kind: TransactionKind;
  amount: number;
  account_id: number;
  to_account_id: number | null;
  category_id: number | null;
  note: string | null;
  frequency: RecurringFrequency;
  interval: number;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  is_active: number;
};

function mapRule(row: RecurringRuleRow): RecurringRuleRecord {
  return {
    id: Number(row.id),
    kind: row.kind,
    amount: Number(row.amount),
    accountId: Number(row.account_id),
    toAccountId: row.to_account_id == null ? null : Number(row.to_account_id),
    categoryId: row.category_id == null ? null : Number(row.category_id),
    note: row.note,
    frequency: row.frequency,
    interval: Number(row.interval),
    startDate: row.start_date,
    endDate: row.end_date,
    nextRunDate: row.next_run_date,
    isActive: Number(row.is_active) === 1,
  };
}

export async function listRecurringRules(db: SQLiteDatabase): Promise<RecurringRuleRecord[]> {
  const rows = await db.getAllAsync<RecurringRuleRow>(
    `SELECT id, kind, amount, account_id, to_account_id, category_id, note, frequency, interval,
            start_date, end_date, next_run_date, is_active
     FROM recurring_rules
     ORDER BY is_active DESC, next_run_date ASC, id ASC`,
  );
  return rows.map(mapRule);
}

export async function saveRecurringRule(db: SQLiteDatabase, input: RecurringRuleInput): Promise<void> {
  const now = new Date().toISOString();
  if (input.id == null) {
    await db.runAsync(
      `INSERT INTO recurring_rules
        (kind, amount, account_id, to_account_id, category_id, note, frequency, interval,
         start_date, end_date, next_run_date, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.kind,
      input.amount,
      input.accountId,
      input.toAccountId,
      input.categoryId,
      input.note,
      input.frequency,
      input.interval,
      input.startDate,
      input.endDate,
      input.startDate,
      input.isActive ? 1 : 0,
      now,
      now,
    );
    return;
  }

  await db.runAsync(
    `UPDATE recurring_rules
     SET kind = ?, amount = ?, account_id = ?, to_account_id = ?, category_id = ?, note = ?,
         frequency = ?, interval = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = ?
     WHERE id = ?`,
    input.kind,
    input.amount,
    input.accountId,
    input.toAccountId,
    input.categoryId,
    input.note,
    input.frequency,
    input.interval,
    input.startDate,
    input.endDate,
    input.isActive ? 1 : 0,
    now,
    input.id,
  );
}

export async function deleteRecurringRule(db: SQLiteDatabase, id: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE transactions SET recurring_rule_id = NULL WHERE recurring_rule_id = ?', id);
    await db.runAsync('DELETE FROM recurring_rules WHERE id = ?', id);
  });
}
