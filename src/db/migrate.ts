import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, SCHEMA_V1_SQL } from '@/db/schema';
import { SEED_TIMESTAMP, seedAccounts, seedCategories, seedSettings } from '@/db/seed';

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    try {
      await db.execAsync("PRAGMA journal_mode = 'wal';");
    } catch {
      // Web SQLite keeps the default journal mode. Android and iOS use WAL.
    }
    const existing = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'accounts'",
    );
    if (!existing) {
      const sql = SCHEMA_V1_SQL.replaceAll('CREATE TABLE ', 'CREATE TABLE IF NOT EXISTS ').replaceAll(
        'CREATE INDEX ',
        'CREATE INDEX IF NOT EXISTS ',
      );
      await db.withTransactionAsync(async () => {
        await db.execAsync(sql);
        await insertSeed(db);
      });
    }
  }

  if (currentVersion < 2) {
    await db.execAsync(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_rule_occurred
       ON transactions (recurring_rule_id, occurred_at)
       WHERE recurring_rule_id IS NOT NULL`,
    );
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function insertSeed(db: SQLiteDatabase): Promise<void> {
  for (const account of seedAccounts) {
    await db.runAsync(
      `INSERT INTO accounts
        (name, type, initial_balance, icon, color, is_archived, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      account.name,
      account.type,
      account.initialBalance,
      account.icon,
      account.color,
      account.sortOrder,
      SEED_TIMESTAMP,
      SEED_TIMESTAMP,
    );
  }

  for (const category of seedCategories) {
    await db.runAsync(
      `INSERT INTO categories
        (name, kind, icon, color, parent_id, is_default, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, 1, ?, ?, ?)`,
      category.name,
      category.kind,
      category.icon,
      category.color,
      category.sortOrder,
      SEED_TIMESTAMP,
      SEED_TIMESTAMP,
    );
  }

  for (const setting of seedSettings) {
    await db.runAsync(
      `INSERT INTO app_settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      setting.key,
      setting.value,
      SEED_TIMESTAMP,
      SEED_TIMESTAMP,
    );
  }
}
