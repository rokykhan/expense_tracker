import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { biometricsAvailable } from '@/features/lock/data/biometrics';
import { clearPin, pinMatches, readLockout, savePin, writeLockout } from '@/features/lock/data/pin-store';
import { PinPad } from '@/features/lock/components/pin-pad';
import { useLock } from '@/features/lock/components/lock-gate';
import { isPin, recordCorrectPin, recordWrongPin, type Lockout } from '@/features/lock/domain/pin';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/providers/settings-context';

type Step =
  | { name: 'create' }
  | { name: 'confirm-create'; first: string }
  | { name: 'current'; next: 'change' | 'remove' }
  | { name: 'change-new' }
  | { name: 'change-confirm'; nextPin: string };

export function LockSetupScreen() {
  const settings = useSettings();
  const lock = useLock();
  const theme = useTheme();
  const [step, setStep] = useState<Step | null>(lock.hasPin ? null : { name: 'create' });
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [lockout, setLockout] = useState<Lockout>({ failures: 0, untilMs: 0 });
  const [now, setNow] = useState(() => Date.now());
  const [biometricReady, setBiometricReady] = useState(false);
  const waiting = lockout.untilMs > now;

  useEffect(() => {
    void readLockout().then(setLockout);
    void biometricsAvailable().then(setBiometricReady);
  }, []);

  useEffect(() => {
    if (!waiting) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [waiting]);

  async function rejectCurrent() {
    const next = recordWrongPin(lockout, Date.now());
    await writeLockout(next);
    setLockout(next);
    setNow(Date.now());
    setMessage(next.untilMs > Date.now() ? copy.lockWait : copy.lockWrong);
    setAttempt((current) => current + 1);
  }

  async function submit(pin: string) {
    if (!step || waiting) {
      return;
    }
    if (!isPin(pin)) {
      setMessage(copy.lockLength);
      return;
    }
    if (step.name === 'create') {
      setMessage(null);
      setStep({ name: 'confirm-create', first: pin });
      return;
    }
    if (step.name === 'confirm-create') {
      if (pin !== step.first) {
        setMessage(copy.lockMismatch);
        setStep({ name: 'create' });
        return;
      }
      await savePin(pin);
      lock.notePinChanged(true);
      setMessage(null);
      setStep(null);
      return;
    }
    if (step.name === 'current') {
      if (!(await pinMatches(pin))) {
        await rejectCurrent();
        return;
      }
      const cleared = recordCorrectPin();
      await writeLockout(cleared);
      setLockout(cleared);
      setMessage(null);
      if (step.next === 'remove') {
        await clearPin();
        await settings.saveBiometrics(false);
        lock.notePinChanged(false);
        setStep({ name: 'create' });
        return;
      }
      setStep({ name: 'change-new' });
      return;
    }
    if (step.name === 'change-new') {
      setMessage(null);
      setStep({ name: 'change-confirm', nextPin: pin });
      return;
    }
    if (pin !== step.nextPin) {
      setMessage(copy.lockMismatch);
      setStep({ name: 'change-new' });
      return;
    }
    await savePin(pin);
    setMessage(null);
    setStep(null);
  }

  const title =
    step?.name === 'confirm-create' || step?.name === 'change-confirm'
      ? copy.lockAgain
      : step?.name === 'current'
        ? copy.lockEnter
        : copy.lockEnter;

  return (
    <Screen>
      {lock.hasPin && step == null ? (
        <>
          <Pressable accessibilityRole="button" onPress={() => setStep({ name: 'current', next: 'change' })}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText>{copy.changeLock}</ThemedText>
            </ThemedView>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setStep({ name: 'current', next: 'remove' })}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText>{copy.removeLock}</ThemedText>
            </ThemedView>
          </Pressable>
          {biometricReady ? (
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: settings.biometrics }}
              onPress={() => void settings.saveBiometrics(!settings.biometrics)}>
              <ThemedView type="backgroundElement" style={[styles.row, settings.biometrics ? { borderColor: theme.accent } : null]}>
                <ThemedText>{copy.lockBiometrics}</ThemedText>
              </ThemedView>
            </Pressable>
          ) : null}
        </>
      ) : null}
      {step ? (
        <PinPad
          key={`${step.name}-${attempt}`}
          title={step.name === 'create' || step.name === 'change-new' ? copy.setLock : title}
          message={waiting ? copy.lockWait : message}
          disabled={waiting && step.name === 'current'}
          onSubmit={(pin) => void submit(pin)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
