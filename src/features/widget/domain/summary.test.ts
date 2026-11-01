import { dhakaDateToIso } from '@/utils/date';

import { ADD_ENTRY_URL, buildSummary, todayExpensePaisa } from '@/features/widget/domain/summary';

describe('widget summary', () => {
  it('counts only today and formats the month net', () => {
    const today = '2026-11-01';
    const spent = todayExpensePaisa(
      [
        { kind: 'expense', amount: 16000, occurredAt: dhakaDateToIso(2026, 11, 1) },
        { kind: 'income', amount: 5000, occurredAt: dhakaDateToIso(2026, 11, 1) },
        { kind: 'expense', amount: 9000, occurredAt: dhakaDateToIso(2026, 10, 31) },
      ],
      today,
    );

    expect(spent).toBe(16000);
    expect(buildSummary({ todayExpense: spent, monthNet: -11000, symbol: '৳', banglaDigits: false })).toEqual({
      todayLabel: 'আজকের ব্যয়',
      todayValue: '-৳160.00',
      monthLabel: 'সঞ্চয়',
      monthValue: '-৳110.00',
      addLabel: 'নতুন এন্ট্রি',
    });
    expect(ADD_ENTRY_URL).toBe('hisabkhata://transaction/new');
  });
});
