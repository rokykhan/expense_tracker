export const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

export const DEFAULT_ACCENT = '#1F4D6E';

export type AccountType = 'cash' | 'bank' | 'mobile_wallet' | 'other';
export type CategoryKind = 'income' | 'expense';

export type SeedAccount = {
  name: string;
  type: AccountType;
  initialBalance: number;
  icon: string;
  color: string;
  sortOrder: number;
};

export type SeedCategory = {
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  sortOrder: number;
};

export type SeedSetting = {
  key: string;
  value: string;
};

export const seedAccounts: SeedAccount[] = [
  {
    name: 'নগদ টাকা',
    type: 'cash',
    initialBalance: 0,
    icon: 'banknote',
    color: DEFAULT_ACCENT,
    sortOrder: 0,
  },
];

export const seedCategories: SeedCategory[] = [
  { name: 'খাবার', kind: 'expense', icon: 'fork.knife', color: '#C46B3A', sortOrder: 0 },
  { name: 'যাতায়াত', kind: 'expense', icon: 'car', color: '#2F6F8F', sortOrder: 1 },
  { name: 'বাসা ভাড়া', kind: 'expense', icon: 'house', color: '#6B5B4B', sortOrder: 2 },
  { name: 'বিল', kind: 'expense', icon: 'doc.text', color: '#3E6B5A', sortOrder: 3 },
  { name: 'মোবাইল রিচার্জ', kind: 'expense', icon: 'phone', color: '#3D5A99', sortOrder: 4 },
  { name: 'চিকিৎসা', kind: 'expense', icon: 'cross.case', color: '#8E4A56', sortOrder: 5 },
  { name: 'শিক্ষা', kind: 'expense', icon: 'book', color: '#4E6B3A', sortOrder: 6 },
  { name: 'কেনাকাটা', kind: 'expense', icon: 'bag', color: '#8A6232', sortOrder: 7 },
  { name: 'বিনোদন', kind: 'expense', icon: 'film', color: '#5C4E86', sortOrder: 8 },
  { name: 'অন্যান্য', kind: 'expense', icon: 'square.grid.2x2', color: '#5E6570', sortOrder: 9 },
  { name: 'বেতন', kind: 'income', icon: 'briefcase', color: DEFAULT_ACCENT, sortOrder: 0 },
  { name: 'ব্যবসা', kind: 'income', icon: 'storefront', color: '#2A6A62', sortOrder: 1 },
  { name: 'উপহার', kind: 'income', icon: 'gift', color: '#A15C7A', sortOrder: 2 },
  { name: 'অন্যান্য', kind: 'income', icon: 'square.grid.2x2', color: '#5E6570', sortOrder: 3 },
];

export const seedSettings: SeedSetting[] = [
  { key: 'bangla_digits', value: '1' },
  { key: 'theme_mode', value: 'system' },
  { key: 'accent', value: DEFAULT_ACCENT },
];
