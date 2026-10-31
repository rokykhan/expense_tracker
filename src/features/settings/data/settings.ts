import type { SQLiteDatabase } from 'expo-sqlite';

export const SETTING_BANGLA_DIGITS = 'bangla_digits';
export const SETTING_PROFILE_NAME = 'profile_name';
export const SETTING_CURRENCY_SYMBOL = 'currency_symbol';
export const DEFAULT_CURRENCY_SYMBOL = '৳';

export type AppSettings = {
  banglaDigits: boolean;
  profileName: string;
  currencySymbol: string;
};

const MISSING_DEFAULTS: [string, string][] = [
  [SETTING_PROFILE_NAME, ''],
  [SETTING_CURRENCY_SYMBOL, DEFAULT_CURRENCY_SYMBOL],
];

export async function readSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const now = new Date().toISOString();
  for (const [key, value] of MISSING_DEFAULTS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO app_settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      key,
      value,
      now,
      now,
    );
  }

  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_settings');
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const symbol = values.get(SETTING_CURRENCY_SYMBOL)?.trim() || DEFAULT_CURRENCY_SYMBOL;

  return {
    banglaDigits: values.get(SETTING_BANGLA_DIGITS) !== '0',
    profileName: values.get(SETTING_PROFILE_NAME) ?? '',
    currencySymbol: symbol,
  };
}

export async function writeSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'UPDATE app_settings SET value = ?, updated_at = ? WHERE key = ?',
    value,
    now,
    key,
  );
  if (result.changes === 0) {
    await db.runAsync(
      'INSERT INTO app_settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)',
      key,
      value,
      now,
      now,
    );
  }
}
