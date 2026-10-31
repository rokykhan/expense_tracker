import { formatPaisa } from '@/utils/money';

describe('formatPaisa', () => {
  it('formats integer paisa with Bangla digits', () => {
    expect(formatPaisa(12345, true)).toBe('১২৩.৪৫');
    expect(formatPaisa(5, true)).toBe('০.০৫');
    expect(formatPaisa(0, true)).toBe('০.০০');
  });

  it('can keep Latin digits when the setting is off', () => {
    expect(formatPaisa(12345, false)).toBe('123.45');
    expect(formatPaisa(-250, false)).toBe('-2.50');
  });

  it('rejects fractional money', () => {
    expect(() => formatPaisa(10.5, true)).toThrow('integer');
  });
});
