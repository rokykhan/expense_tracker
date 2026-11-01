export type Lockout = {
  failures: number;
  untilMs: number;
};

const PIN_PATTERN = /^[0-9]{4,6}$/;

export function isPin(value: string): boolean {
  return PIN_PATTERN.test(value);
}

/** Wait time after this many wrong attempts in a row. */
export function lockoutMs(failures: number): number {
  if (failures >= 5) {
    return 60_000;
  }
  if (failures >= 3) {
    return 15_000;
  }
  return 0;
}

export function recordWrongPin(state: Lockout, nowMs: number): Lockout {
  const failures = state.failures + 1;
  const wait = lockoutMs(failures);
  return { failures, untilMs: wait === 0 ? 0 : nowMs + wait };
}

export function recordCorrectPin(): Lockout {
  return { failures: 0, untilMs: 0 };
}

export function isLockedOut(state: Lockout, nowMs: number): boolean {
  return state.untilMs > nowMs;
}

export async function hashPin(
  pin: string,
  salt: string,
  digest: (value: string) => Promise<string>,
): Promise<string> {
  const hashed = await digest(`${salt}:${pin}`);
  if (hashed.length === 0 || hashed === pin) {
    throw new Error('PIN digest was not stored as a hash.');
  }
  return hashed;
}
