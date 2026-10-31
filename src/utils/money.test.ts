import { formatMoney, formatPaisa, parseAmountToPaisa, paisaToInput } from '@/utils/money';

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

describe('parseAmountToPaisa', () => {
  it('reads taka and paisa without using a float amount', () => {
    expect(parseAmountToPaisa('১২৩.৪৫')).toBe(12345);
    expect(parseAmountToPaisa('10')).toBe(1000);
    expect(parseAmountToPaisa('10.5')).toBe(1050);
    expect(parseAmountToPaisa('0.05')).toBe(5);
    expect(paisaToInput(12345)).toBe('123.45');
  });

  it('rejects empty, zero, and extra fraction digits', () => {
    expect(parseAmountToPaisa('')).toBeNull();
    expect(parseAmountToPaisa('0')).toBeNull();
    expect(parseAmountToPaisa('10.555')).toBeNull();
    expect(parseAmountToPaisa('0', { allowZero: true })).toBe(0);
    expect(parseAmountToPaisa('-2.50', { allowNegative: true })).toBe(-250);
  });

  it('places the currency symbol after the sign', () => {
    expect(formatMoney(-250, '৳', false)).toBe('-৳2.50');
    expect(formatMoney(100, '৳', false)).toBe('৳1.00');
  });
});
