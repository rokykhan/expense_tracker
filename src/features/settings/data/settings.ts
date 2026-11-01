import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_ACCENT } from '@/db/seed';
import { isThemeMode, knownAccent, type ThemeMode } from '@/features/settings/domain/appearance';

export const SETTING_BANGLA_DIGITS = 'bangla_digits';
export const SETTING_PROFILE_NAME = 'profile_name';
export const SETTING_CURRENCY_SYMBOL = 'currency_symbol';
export const SETTING_THEME_MODE = 'theme_mode';
export const SETTING_ACCENT = 'accent';
export const SETTING_HIDE_PREVIEW = 'hide_preview';
export const SETTING_BIOMETRICS = 'biometrics';
export const DEFAULT_CURRENCY_SYMBOL = '৳';

export type AppSettings = {
  banglaDigits: boolean;
  profileName: string;
  currencySymbol: string;
  themeMode: ThemeMode;
  accent: string;
  hidePreview: boolean;
  biometrics: boolean;
};

const MISSING_DEFAULTS: [string, string][] = [
  [SETTING_PROFILE_NAME, ''],
  [SETTING_CURRENCY_SYMBOL, DEFAULT_CURRENCY_SYMBOL],
  [SETTING_THEME_MODE, 'system'],
  [SETTING_ACCENT, DEFAULT_ACCENT],
  [SETTING_HIDE_PREVIEW, '0'],
  [SETTING_BIOMETRICS, '0'],
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
  const themeValue = values.get(SETTING_THEME_MODE) ?? 'system';

  return {
    banglaDigits: values.get(SETTING_BANGLA_DIGITS) !== '0',
    profileName: values.get(SETTING_PROFILE_NAME) ?? '',
    currencySymbol: symbol,
    themeMode: isThemeMode(themeValue) ? themeValue : 'system',
    accent: knownAccent(values.get(SETTING_ACCENT)),
    hidePreview: values.get(SETTING_HIDE_PREVIEW) === '1',
    biometrics: values.get(SETTING_BIOMETRICS) === '1',
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
