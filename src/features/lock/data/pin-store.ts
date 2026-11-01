import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytesAsync } from 'expo-crypto';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';
import { Platform } from 'react-native';

import { hashPin, type Lockout } from '@/features/lock/domain/pin';

const HASH_KEY = 'hisabkhata.pin.hash';
const SALT_KEY = 'hisabkhata.pin.salt';
const FAILURES_KEY = 'hisabkhata.pin.failures';
const UNTIL_KEY = 'hisabkhata.pin.until';

async function readKey(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(key);
  }
  return getItemAsync(key);
}

async function writeKey(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await setItemAsync(key, value);
}

async function removeKey(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  try {
    await deleteItemAsync(key);
  } catch {
    // A missing key is already gone.
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function digest(value: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, value);
}

export async function hasPin(): Promise<boolean> {
  const hash = await readKey(HASH_KEY);
  const salt = await readKey(SALT_KEY);
  return Boolean(hash && salt);
}

export async function savePin(pin: string): Promise<void> {
  const salt = bytesToHex(await getRandomBytesAsync(16));
  const hashed = await hashPin(pin, salt, digest);
  await writeKey(SALT_KEY, salt);
  await writeKey(HASH_KEY, hashed);
  await writeLockout({ failures: 0, untilMs: 0 });
}

export async function clearPin(): Promise<void> {
  await removeKey(HASH_KEY);
  await removeKey(SALT_KEY);
  await writeLockout({ failures: 0, untilMs: 0 });
}

export async function pinMatches(pin: string): Promise<boolean> {
  const hash = await readKey(HASH_KEY);
  const salt = await readKey(SALT_KEY);
  if (!hash || !salt) {
    return false;
  }
  const attempt = await hashPin(pin, salt, digest);
  return attempt === hash;
}

export async function readLockout(): Promise<Lockout> {
  const failures = Number(await readKey(FAILURES_KEY));
  const untilMs = Number(await readKey(UNTIL_KEY));
  return {
    failures: Number.isInteger(failures) && failures > 0 ? failures : 0,
    untilMs: Number.isFinite(untilMs) && untilMs > 0 ? untilMs : 0,
  };
}

export async function writeLockout(state: Lockout): Promise<void> {
  await writeKey(FAILURES_KEY, String(state.failures));
  await writeKey(UNTIL_KEY, String(state.untilMs));
}
