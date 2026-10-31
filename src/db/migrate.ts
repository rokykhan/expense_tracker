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
    await db.execAsync("PRAGMA journal_mode = 'wal';");
    await db.withTransactionAsync(async () => {
      await db.execAsync(SCHEMA_V1_SQL);
      await insertSeed(db);
    });
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
