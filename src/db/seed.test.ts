import { seedAccounts, seedCategories, seedSettings } from '@/db/seed';

describe('seed data', () => {
  it('creates one cash account', () => {
    expect(seedAccounts).toEqual([
      expect.objectContaining({
        name: 'নগদ টাকা',
        type: 'cash',
        initialBalance: 0,
      }),
    ]);
  });

  it('creates the default expense and income categories', () => {
    const names = (kind: 'expense' | 'income') =>
      seedCategories.filter((category) => category.kind === kind).map((category) => category.name);

    expect(names('expense')).toEqual([
      'খাবার',
      'যাতায়াত',
      'বাসা ভাড়া',
      'বিল',
      'মোবাইল রিচার্জ',
      'চিকিৎসা',
      'শিক্ষা',
      'কেনাকাটা',
      'বিনোদন',
      'অন্যান্য',
    ]);
    expect(names('income')).toEqual(['বেতন', 'ব্যবসা', 'উপহার', 'অন্যান্য']);
  });

  it('turns Bangla digits on and follows the system theme', () => {
    expect(seedSettings).toEqual([
      { key: 'bangla_digits', value: '1' },
      { key: 'theme_mode', value: 'system' },
      { key: 'accent', value: '#1F4D6E' },
    ]);
  });
});
