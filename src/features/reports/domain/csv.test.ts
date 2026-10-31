import { paisaColumnTotal, toCsv } from '@/features/reports/domain/csv';

describe('report csv', () => {
  const rows = [
    {
      day: '2026-11-01',
      kind: 'ব্যয়',
      paisa: 2000,
      account: 'নগদ টাকা',
      category: 'খাবার',
      note: 'চা, দুধ',
    },
    {
      day: '2026-11-01',
      kind: 'ব্যয়',
      paisa: 14000,
      account: 'নগদ টাকা',
      category: 'খাবার',
      note: 'বলে "ধন্যবাদ"',
    },
  ];

  it('stores integer paisa that add up to the report rows', () => {
    const csv = toCsv(rows);
    expect(csv.startsWith('\uFEFFতারিখ,ধরন,পয়সা,হিসাব,খাত,নোট')).toBe(true);
    expect(csv).toContain('"চা, দুধ"');
    expect(csv).toContain('"বলে ""ধন্যবাদ"""');
    expect(paisaColumnTotal(csv)).toBe(16000);
    expect(csv).not.toContain('.');
  });
});
