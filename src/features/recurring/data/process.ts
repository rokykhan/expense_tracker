import type { SQLiteDatabase } from 'expo-sqlite';

import { listRecurringRules } from '@/features/recurring/data/rules';
import { datesToInsert, planRecurring } from '@/features/recurring/domain/schedule';
import { dhakaDateToIso, dhakaDayKey, todayDhakaDayKey } from '@/utils/date';

let inFlight: Promise<number> | null = null;

export function processDueRules(db: SQLiteDatabase, today = todayDhakaDayKey()): Promise<number> {
  if (!inFlight) {
    inFlight = insertDueRules(db, today).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function insertDueRules(db: SQLiteDatabase, today: string): Promise<number> {
  const rules = await listRecurringRules(db);
  let inserted = 0;

  for (const rule of rules) {
    const plan = planRecurring(rule, today);
    const existing = await db.getAllAsync<{ occurred_at: string }>(
      'SELECT occurred_at FROM transactions WHERE recurring_rule_id = ?',
      rule.id,
    );
    const pending = datesToInsert(
      plan.dates,
      existing.map((row) => dhakaDayKey(row.occurred_at)),
    );
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      for (const day of pending) {
        const [year, month, date] = day.split('-').map(Number);
        await db.runAsync(
          `INSERT INTO transactions
            (kind, amount, account_id, to_account_id, category_id, note, occurred_at, recurring_rule_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          rule.kind,
          rule.amount,
          rule.accountId,
          rule.toAccountId,
          rule.categoryId,
          rule.note,
          dhakaDateToIso(year, month, date),
          rule.id,
          now,
          now,
        );
        inserted += 1;
      }

      if (plan.nextRunDate !== rule.nextRunDate || plan.isActive !== rule.isActive) {
        await db.runAsync(
          'UPDATE recurring_rules SET next_run_date = ?, is_active = ?, updated_at = ? WHERE id = ?',
          plan.nextRunDate,
          plan.isActive ? 1 : 0,
          now,
          rule.id,
        );
      }
    });
  }

  return inserted;
}
