import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategoryKind } from '@/db/types';
import type { CategoryInput, CategoryRecord } from '@/features/categories/domain/types';

type CategoryRow = {
  id: number;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  is_default: number;
  sort_order: number;
};

function mapCategory(row: CategoryRow): CategoryRecord {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    icon: row.icon,
    color: row.color,
    isDefault: Number(row.is_default) === 1,
    sortOrder: row.sort_order,
  };
}

export async function listCategories(db: SQLiteDatabase): Promise<CategoryRecord[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT id, name, kind, icon, color, is_default, sort_order
     FROM categories
     ORDER BY kind ASC, sort_order ASC, name ASC`,
  );
  return rows.map(mapCategory);
}

export async function saveCategory(db: SQLiteDatabase, input: CategoryInput): Promise<void> {
  const now = new Date().toISOString();
  if (input.id == null) {
    const next = await db.getFirstAsync<{ next_order: number }>(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM categories WHERE kind = ?',
      input.kind,
    );
    await db.runAsync(
      `INSERT INTO categories
        (name, kind, icon, color, parent_id, is_default, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, 0, ?, ?, ?)`,
      input.name,
      input.kind,
      input.icon,
      input.color,
      next?.next_order ?? 0,
      now,
      now,
    );
    return;
  }

  await db.runAsync(
    `UPDATE categories
     SET name = ?, icon = ?, color = ?, updated_at = ?
     WHERE id = ?`,
    input.name,
    input.icon,
    input.color,
    now,
    input.id,
  );
}

export async function categoryUsageCount(db: SQLiteDatabase, categoryId: number): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT
       (SELECT COUNT(*) FROM transactions WHERE category_id = ?) +
       (SELECT COUNT(*) FROM recurring_rules WHERE category_id = ?) +
       (SELECT COUNT(*) FROM quick_entries WHERE category_id = ?) +
       (SELECT COUNT(*) FROM budgets WHERE category_id = ?) AS count`,
    categoryId,
    categoryId,
    categoryId,
    categoryId,
  );
  return row?.count ?? 0;
}

export async function deleteCategory(db: SQLiteDatabase, categoryId: number): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ?', categoryId);
}
