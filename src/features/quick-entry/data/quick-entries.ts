import type { SQLiteDatabase } from 'expo-sqlite';

import type { TransactionKind } from '@/db/types';
import type { QuickEntryInput, QuickEntryRecord } from '@/features/quick-entry/domain/types';
import { dhakaDateToIso, todayDhakaDayKey } from '@/utils/date';

type QuickEntryRow = {
  id: number;
  title: string;
  kind: TransactionKind;
  amount: number;
  account_id: number;
  category_id: number;
  note: string | null;
  sort_order: number;
};

function mapQuickEntry(row: QuickEntryRow): QuickEntryRecord {
  return {
    id: Number(row.id),
    title: row.title,
    kind: row.kind,
    amount: Number(row.amount),
    accountId: Number(row.account_id),
    categoryId: Number(row.category_id),
    note: row.note,
    sortOrder: Number(row.sort_order),
  };
}

export async function listQuickEntries(db: SQLiteDatabase): Promise<QuickEntryRecord[]> {
  const rows = await db.getAllAsync<QuickEntryRow>(
    `SELECT id, title, kind, amount, account_id, category_id, note, sort_order
     FROM quick_entries
     WHERE amount IS NOT NULL AND kind IN ('income', 'expense')
     ORDER BY sort_order ASC, id ASC`,
  );
  return rows.map(mapQuickEntry);
}

export async function saveQuickEntry(db: SQLiteDatabase, input: QuickEntryInput): Promise<void> {
  const now = new Date().toISOString();
  if (input.id == null) {
    const row = await db.getFirstAsync<{ next_order: number | null }>(
      'SELECT MAX(sort_order) AS next_order FROM quick_entries',
    );
    await db.runAsync(
      `INSERT INTO quick_entries
        (title, kind, amount, account_id, category_id, note, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.title,
      input.kind,
      input.amount,
      input.accountId,
      input.categoryId,
      input.note,
      (row?.next_order ?? 0) + 1,
      now,
      now,
    );
    return;
  }

  await db.runAsync(
    `UPDATE quick_entries
     SET title = ?, kind = ?, amount = ?, account_id = ?, category_id = ?, note = ?, updated_at = ?
     WHERE id = ?`,
    input.title,
    input.kind,
    input.amount,
    input.accountId,
    input.categoryId,
    input.note,
    now,
    input.id,
  );
}

export async function deleteQuickEntry(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM quick_entries WHERE id = ?', id);
}

export async function moveQuickEntry(db: SQLiteDatabase, id: number, direction: -1 | 1): Promise<void> {
  const entries = await listQuickEntries(db);
  const index = entries.findIndex((entry) => entry.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= entries.length) {
    return;
  }

  const ordered = entries.slice();
  const [moved] = ordered.splice(index, 1);
  ordered.splice(target, 0, moved);
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (let position = 0; position < ordered.length; position += 1) {
      await db.runAsync(
        'UPDATE quick_entries SET sort_order = ?, updated_at = ? WHERE id = ?',
        position,
        now,
        ordered[position].id,
      );
    }
  });
}

export async function applyQuickEntry(db: SQLiteDatabase, entry: QuickEntryRecord): Promise<void> {
  const now = new Date().toISOString();
  const [year, month, day] = todayDhakaDayKey().split('-').map(Number);
  await db.runAsync(
    `INSERT INTO transactions
      (kind, amount, account_id, to_account_id, category_id, note, occurred_at, recurring_rule_id, created_at, updated_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, ?, ?)`,
    entry.kind,
    entry.amount,
    entry.accountId,
    entry.categoryId,
    entry.note,
    dhakaDateToIso(year, month, day),
    now,
    now,
  );
}
