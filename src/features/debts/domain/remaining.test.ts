import { debtRemaining, isOverdue, personOpenTotals } from '@/features/debts/domain/remaining';

describe('debt remaining', () => {
  it('keeps the unpaid amount after partial payments', () => {
    expect(debtRemaining(10000, [2500, 2500])).toBe(5000);
    expect(debtRemaining(10000, [10000])).toBe(0);
  });

  it('adds one person’s open debts and skips settled ones', () => {
    const totals = personOpenTotals([
      { personName: 'রহিম', kind: 'borrowed', remaining: 5000, isSettled: false },
      { personName: 'রহিম', kind: 'borrowed', remaining: 2000, isSettled: false },
      { personName: 'রহিম', kind: 'borrowed', remaining: 9000, isSettled: true },
      { personName: 'করিম', kind: 'lent', remaining: 1000, isSettled: false },
    ]);

    expect(totals).toEqual([
      { personName: 'রহিম', kind: 'borrowed', remaining: 7000 },
      { personName: 'করিম', kind: 'lent', remaining: 1000 },
    ]);
  });

  it('marks only an open debt past its due date', () => {
    expect(isOverdue('2026-01-01', '2026-01-02', false, 100)).toBe(true);
    expect(isOverdue('2026-01-02', '2026-01-02', false, 100)).toBe(false);
    expect(isOverdue('2026-01-01', '2026-01-02', true, 100)).toBe(false);
    expect(isOverdue(null, '2026-01-02', false, 100)).toBe(false);
  });
});
