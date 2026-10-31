import type { SQLiteDatabase } from 'expo-sqlite';

export type BudgetRecord = {
  id: number;
  categoryId: number | null;
  amount: number;
  year: number;
  month: number;
};

type BudgetRow = {
  id: number;
  category_id: number | null;
  amount: number;
  year: number;
  month: number;
};

function mapBudget(row: BudgetRow): BudgetRecord {
  return {
    id: Number(row.id),
    categoryId: row.category_id == null ? null : Number(row.category_id),
    amount: Number(row.amount),
    year: Number(row.year),
    month: Number(row.month),
  };
}

export async function listBudgets(db: SQLiteDatabase): Promise<BudgetRecord[]> {
  const rows = await db.getAllAsync<BudgetRow>(
    'SELECT id, category_id, amount, year, month FROM budgets ORDER BY year, month, id',
  );
  return rows.map(mapBudget);
}

export async function saveBudget(
  db: SQLiteDatabase,
  input: { categoryId: number | null; amount: number; year: number; month: number },
): Promise<void> {
  const now = new Date().toISOString();
  const existing =
    input.categoryId == null
      ? await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM budgets WHERE year = ? AND month = ? AND category_id IS NULL',
          input.year,
          input.month,
        )
      : await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM budgets WHERE year = ? AND month = ? AND category_id = ?',
          input.year,
          input.month,
          input.categoryId,
        );

  if (existing) {
    await db.runAsync('UPDATE budgets SET amount = ?, updated_at = ? WHERE id = ?', input.amount, now, existing.id);
    return;
  }

  await db.runAsync(
    `INSERT INTO budgets (category_id, amount, year, month, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.categoryId,
    input.amount,
    input.year,
    input.month,
    now,
    now,
  );
}

export async function deleteBudget(db: SQLiteDatabase, budgetId: number): Promise<void> {
  await db.runAsync('DELETE FROM budgets WHERE id = ?', budgetId);
}

export async function copyBudgetsFromMonth(
  db: SQLiteDatabase,
  from: { year: number; month: number },
  to: { year: number; month: number },
): Promise<number> {
  const rows = await listBudgets(db);
  const source = rows.filter((row) => row.year === from.year && row.month === from.month);
  const present = new Set(
    rows
      .filter((row) => row.year === to.year && row.month === to.month)
      .map((row) => (row.categoryId == null ? 'overall' : String(row.categoryId))),
  );
  let copied = 0;

  for (const row of source) {
    const key = row.categoryId == null ? 'overall' : String(row.categoryId);
    if (present.has(key)) {
      continue;
    }
    await saveBudget(db, {
      categoryId: row.categoryId,
      amount: row.amount,
      year: to.year,
      month: to.month,
    });
    copied += 1;
  }

  return copied;
}
