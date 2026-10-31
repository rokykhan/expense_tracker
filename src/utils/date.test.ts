import { dhakaDateToIso, dhakaMonthBounds, formatDateDhaka, shiftDay, shiftMonth } from '@/utils/date';

describe('formatDateDhaka', () => {
  it('shows the Asia/Dhaka calendar day', () => {
    expect(formatDateDhaka('2026-01-01T00:00:00.000Z', false)).toContain('1');
    expect(formatDateDhaka('2026-01-01T18:30:00.000Z', false)).toContain('2');
  });

  it('uses Bangla digits by default', () => {
    expect(formatDateDhaka('2026-01-01T00:00:00.000Z')).toContain('২০২৬');
  });

  it('rejects an invalid timestamp', () => {
    expect(() => formatDateDhaka('not-a-date')).toThrow('Invalid date');
  });
});

describe('Dhaka month bounds', () => {
  it('starts a calendar day at Dhaka midnight', () => {
    expect(dhakaDateToIso(2026, 1, 1)).toBe('2025-12-31T18:00:00.000Z');
    expect(dhakaMonthBounds(2026, 1).endMs).toBe(Date.parse(dhakaDateToIso(2026, 2, 1)));
  });

  it('steps months and days across year and leap-day boundaries', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDay('2024-03-01', -1)).toBe('2024-02-29');
  });
});
