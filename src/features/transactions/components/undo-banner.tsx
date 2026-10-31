import { useSQLiteContext } from 'expo-sqlite';
import { useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { restoreTransaction } from '@/features/transactions/data/transactions';
import {
  clearDeletedTransaction,
  peekDeletedTransaction,
  subscribeDeletedTransaction,
} from '@/features/transactions/domain/undo';
import { useTheme } from '@/hooks/use-theme';

type UndoBannerProps = {
  tabBar?: boolean;
  onRestored: () => void;
};

export function UndoBanner({ tabBar = false, onRestored }: UndoBannerProps) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const pending = useSyncExternalStore(
    subscribeDeletedTransaction,
    peekDeletedTransaction,
    peekDeletedTransaction,
  );
  const [error, setError] = useState<string | null>(null);

  if (!pending && !error) {
    return null;
  }

  async function undo() {
    if (!pending) {
      return;
    }
    try {
      await restoreTransaction(db, pending);
      clearDeletedTransaction();
      setError(null);
      onRestored();
    } catch {
      setError(copy.dbError);
    }
  }

  return (
    <ThemedView
      type="backgroundSelected"
      style={[styles.banner, { bottom: Spacing.three + (tabBar ? BottomTabInset : 0) }]}>
      <ThemedText type="small" style={styles.message}>
        {error ?? copy.deleted}
      </ThemedText>
      {pending ? (
        <Pressable accessibilityRole="button" onPress={() => void undo()}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            {copy.undo}
          </ThemedText>
        </Pressable>
      ) : (
        <View />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  message: {
    flex: 1,
  },
});
