import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { hasPin } from '@/features/lock/data/pin-store';
import { LockScreen } from '@/features/lock/components/lock-screen';

type LockControls = {
  hasPin: boolean;
  notePinChanged: (exists: boolean) => void;
};

const LockContext = createContext<LockControls | null>(null);

export function useLock() {
  const value = useContext(LockContext);
  if (!value) {
    throw new Error('LockProvider is missing.');
  }
  return value;
}

export function LockGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [locked, setLocked] = useState(false);
  const pinSetRef = useRef(false);

  const notePinChanged = useCallback((exists: boolean) => {
    pinSetRef.current = exists;
    setPinSet(exists);
    if (!exists) {
      setLocked(false);
    }
  }, []);

  const unlock = useCallback(() => setLocked(false), []);

  useEffect(() => {
    let cancelled = false;
    void hasPin().then((exists) => {
      if (cancelled) {
        return;
      }
      pinSetRef.current = exists;
      setPinSet(exists);
      setLocked(exists);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background' && pinSetRef.current) {
        setLocked(true);
      }
    });
    return () => subscription.remove();
  }, []);

  if (!ready) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>{copy.loading}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <LockContext.Provider value={{ hasPin: pinSet, notePinChanged }}>
      <View style={styles.fill}>
        <View
          accessibilityElementsHidden={locked}
          importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
          style={locked ? styles.hidden : styles.fill}>
          {children}
        </View>
        {locked ? (
          <View style={styles.cover}>
            <LockScreen onUnlock={unlock} />
          </View>
        ) : null}
      </View>
    </LockContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  cover: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
});
