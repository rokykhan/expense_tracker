import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { confirmBiometric } from '@/features/lock/data/biometrics';
import { pinMatches, readLockout, writeLockout } from '@/features/lock/data/pin-store';
import { isPin, recordCorrectPin, recordWrongPin, type Lockout } from '@/features/lock/domain/pin';
import { PinPad } from '@/features/lock/components/pin-pad';
import { useSettings } from '@/providers/settings-context';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { biometrics } = useSettings();
  const [lockout, setLockout] = useState<Lockout>({ failures: 0, untilMs: 0 });
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const waiting = lockout.untilMs > now;

  useEffect(() => {
    void readLockout().then(setLockout);
  }, []);

  useEffect(() => {
    if (!waiting) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [waiting]);

  useEffect(() => {
    if (!biometrics) {
      return;
    }
    let cancelled = false;
    void confirmBiometric().then((ok) => {
      if (ok && !cancelled) {
        onUnlock();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [biometrics, onUnlock]);

  async function submit(pin: string) {
    if (waiting) {
      return;
    }
    if (!isPin(pin)) {
      setMessage(copy.lockLength);
      return;
    }
    if (await pinMatches(pin)) {
      const next = recordCorrectPin();
      await writeLockout(next);
      setLockout(next);
      onUnlock();
      return;
    }
    const next = recordWrongPin(lockout, Date.now());
    await writeLockout(next);
    setLockout(next);
    setNow(Date.now());
    setMessage(next.untilMs > Date.now() ? copy.lockWait : copy.lockWrong);
    setAttempt((current) => current + 1);
  }

  return (
    <ThemedView style={styles.fill}>
      <PinPad
        key={attempt}
        title={copy.lockEnter}
        message={waiting ? copy.lockWait : message}
        disabled={waiting}
        onSubmit={(pin) => void submit(pin)}
      />
      {biometrics ? (
        <Pressable accessibilityRole="button" onPress={() => void confirmBiometric().then((ok) => ok && onUnlock())} style={styles.biometric}>
          <ThemedText type="smallBold">{copy.lockBiometricUnlock}</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: 'center',
  },
  biometric: {
    alignItems: 'center',
    paddingBottom: Spacing.four,
  },
});
