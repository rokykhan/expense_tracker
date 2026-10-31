export const DATABASE_VERSION = 1;

export const SCHEMA_V1_SQL = `
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'mobile_wallet', 'other')),
  initial_balance INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE recurring_rules (
  id INTEGER PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'transfer')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  to_account_id INTEGER REFERENCES accounts(id),
  category_id INTEGER REFERENCES categories(id),
  note TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval INTEGER NOT NULL CHECK (interval > 0),
  start_date TEXT NOT NULL,
  end_date TEXT,
  next_run_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'transfer')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  to_account_id INTEGER REFERENCES accounts(id),
  category_id INTEGER REFERENCES categories(id),
  note TEXT,
  occurred_at TEXT NOT NULL,
  recurring_rule_id INTEGER REFERENCES recurring_rules(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE quick_entries (
  id INTEGER PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'transfer')),
  amount INTEGER CHECK (amount IS NULL OR amount > 0),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE budgets (
  id INTEGER PRIMARY KEY NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE savings_goals (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  target_amount INTEGER NOT NULL CHECK (target_amount > 0),
  deadline TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE savings_deposits (
  id INTEGER PRIMARY KEY NOT NULL,
  goal_id INTEGER NOT NULL REFERENCES savings_goals(id),
  amount INTEGER NOT NULL CHECK (amount != 0),
  occurred_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE debts (
  id INTEGER PRIMARY KEY NOT NULL,
  person_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('lent', 'borrowed')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  occurred_at TEXT NOT NULL,
  due_date TEXT,
  note TEXT,
  is_settled INTEGER NOT NULL DEFAULT 0 CHECK (is_settled IN (0, 1)),
  linked_account_id INTEGER REFERENCES accounts(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE debt_payments (
  id INTEGER PRIMARY KEY NOT NULL,
  debt_id INTEGER NOT NULL REFERENCES debts(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  occurred_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_pinned INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  due_date TEXT,
  remind_at TEXT,
  is_done INTEGER NOT NULL DEFAULT 0 CHECK (is_done IN (0, 1)),
  notification_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_transactions_occurred_at ON transactions (occurred_at);
CREATE INDEX idx_transactions_account_id ON transactions (account_id);
CREATE INDEX idx_transactions_category_id ON transactions (category_id);
`;
