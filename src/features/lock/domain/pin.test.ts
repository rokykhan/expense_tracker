import { hashPin, isLockedOut, isPin, recordCorrectPin, recordWrongPin } from '@/features/lock/domain/pin';

describe('pin', () => {
  it('accepts 4 to 6 digits', () => {
    expect(isPin('1234')).toBe(true);
    expect(isPin('12345')).toBe(true);
    expect(isPin('123456')).toBe(true);
    expect(isPin('123')).toBe(false);
    expect(isPin('1234567')).toBe(false);
    expect(isPin('12a4')).toBe(false);
  });

  it('waits longer after repeated wrong attempts', () => {
    const now = 1_000_000;
    const once = recordWrongPin({ failures: 0, untilMs: 0 }, now);
    const twice = recordWrongPin(once, now);
    const three = recordWrongPin(twice, now);
    const five = recordWrongPin(recordWrongPin(three, now), now);

    expect(once).toEqual({ failures: 1, untilMs: 0 });
    expect(twice).toEqual({ failures: 2, untilMs: 0 });
    expect(three).toEqual({ failures: 3, untilMs: now + 15_000 });
    expect(five).toEqual({ failures: 5, untilMs: now + 60_000 });
    expect(isLockedOut(three, now + 14_000)).toBe(true);
    expect(isLockedOut(three, now + 15_000)).toBe(false);
    expect(recordCorrectPin()).toEqual({ failures: 0, untilMs: 0 });
  });

  it('stores a hash instead of the PIN', async () => {
    const hashed = await hashPin('1234', 'salt', async (value) => `hash:${value}`);
    expect(hashed).toBe('hash:salt:1234');
    expect(hashed).not.toBe('1234');
    await expect(hashPin('1234', 'salt', async () => '1234')).rejects.toThrow(/hash/);
  });
});
