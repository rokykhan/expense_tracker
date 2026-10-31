import { formatDateDhaka } from '@/utils/date';

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
