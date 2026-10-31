import { DATABASE_VERSION, SCHEMA_V1_SQL } from '@/db/schema';

const TABLES = [
  'accounts',
  'categories',
  'transactions',
  'recurring_rules',
  'quick_entries',
  'budgets',
  'savings_goals',
  'savings_deposits',
  'debts',
  'debt_payments',
  'notes',
  'tasks',
  'app_settings',
];

describe('schema', () => {
  it('starts at version 1 and stores money as integers', () => {
    expect(DATABASE_VERSION).toBe(1);
    expect(SCHEMA_V1_SQL).not.toMatch(/\b(REAL|FLOAT|DOUBLE)\b/);
  });

  it('creates every table and the transaction indexes', () => {
    for (const table of TABLES) {
      expect(SCHEMA_V1_SQL).toContain(`CREATE TABLE ${table}`);
    }
    expect(SCHEMA_V1_SQL).toContain('idx_transactions_occurred_at');
    expect(SCHEMA_V1_SQL).toContain('idx_transactions_account_id');
    expect(SCHEMA_V1_SQL).toContain('idx_transactions_category_id');
  });
});
