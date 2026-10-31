import type { SQLiteDatabase } from 'expo-sqlite';

import type { AccountType } from '@/db/types';
import type { AccountInput, AccountRecord } from '@/features/accounts/domain/types';

type AccountRow = {
  id: number;
  name: string;
  type: AccountType;
  initial_balance: number;
  icon: string;
  color: string;
  is_archived: number;
  sort_order: number;
};

function mapAccount(row: AccountRow): AccountRecord {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    initialBalance: Number(row.initial_balance),
    icon: row.icon,
    color: row.color,
    isArchived: Number(row.is_archived) === 1,
    sortOrder: row.sort_order,
  };
}

export async function listAccounts(db: SQLiteDatabase): Promise<AccountRecord[]> {
  const rows = await db.getAllAsync<AccountRow>(
    `SELECT id, name, type, initial_balance, icon, color, is_archived, sort_order
     FROM accounts
     ORDER BY is_archived ASC, sort_order ASC, name ASC`,
  );
  return rows.map(mapAccount);
}

export async function saveAccount(db: SQLiteDatabase, input: AccountInput): Promise<void> {
  const now = new Date().toISOString();
  if (input.id == null) {
    const next = await db.getFirstAsync<{ next_order: number }>(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM accounts',
    );
    await db.runAsync(
      `INSERT INTO accounts
        (name, type, initial_balance, icon, color, is_archived, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.name,
      input.type,
      input.initialBalance,
      input.icon,
      input.color,
      input.isArchived ? 1 : 0,
      next?.next_order ?? 0,
      now,
      now,
    );
    return;
  }

  await db.runAsync(
    `UPDATE accounts
     SET name = ?, type = ?, initial_balance = ?, icon = ?, color = ?, is_archived = ?, updated_at = ?
     WHERE id = ?`,
    input.name,
    input.type,
    input.initialBalance,
    input.icon,
    input.color,
    input.isArchived ? 1 : 0,
    now,
    input.id,
  );
}
